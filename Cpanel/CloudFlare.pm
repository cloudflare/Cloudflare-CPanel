package Cpanel::CloudFlare;

# cpanel - Cpanel/CloudFlare.pm                   Copyright(c) 2010 CloudFlare, Inc.
#                                                               All rights Reserved.
# copyright@cloudflare.com                                     http://cloudflare.com
# This code is subject to the cPanel license. Unauthorized copying is prohibited

use Cpanel::DnsUtils::UsercPanel ();
use Cpanel::AdminBin             ();
use Cpanel::Locale               ();
use Cpanel::Logger               ();
use Cpanel::UrlTools             ();
use Cpanel::SocketIP             ();
use Cpanel::Encoder::URI         ();
use Cpanel::CustInfo             ();
use Cpanel::AcctUtils            ();

use Socket                       ();
use JSON::Syck                   ();

my $logger = Cpanel::Logger->new();
my $locale;
my $cf_config_file = "/usr/local/cpanel/etc/cloudflare.json";
my $cf_host_key;
my $cf_host_name;
my $cf_host_uri;
my $cf_host_port;
my $cf_host_prefix;
my $has_ssl;

## Initialize vars here.
sub CloudFlare_init { 
    my $data = JSON::Syck::LoadFile($cf_config_file);
    $cf_host_key = $data->{"host_key"};
    $cf_host_name = $data->{"host_name"};
    $cf_host_uri = $data->{"host_uri"};
    $cf_host_port = $data->{"host_port"};
    $cf_host_prefix = $data->{"host_prefix"};

    eval { use Net::SSLeay qw(post_https make_headers make_form); $has_ssl = 1 };
    if ( !$has_ssl ) {
        $logger->warn("Failed to load Net::SSLeay: $@.\nDisabling functionality until fixed.");
    }
}


# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_user_create {
    my %OPTS = @_;

    if (!$cf_host_key) {
        $logger->info("Missing cf_host_key! Define this in $cf_config_file.");
        return [];
    }

    # Use a random string as a password.
    my $password = crypt(int(rand(10000000)), time);
    $logger->info("Createing Cloudflare user for " . $OPTS{"email"} . " -- " . $password);
   
    ## Otherwise, try to create this user.
    my $args = {
        "host" => $cf_host_name,
        "uri" => $cf_host_uri,
        "port" => $cf_host_port,
        "query" => {
            "act" => "user_create",
            "host_key" => $cf_host_key,
            "cloudflare_email" => $OPTS{"email"},
            "cloudflare_pass" => $password,
            "cloudflare_username" => $OPTS{"user"}
        },
    };

    my $result = __https_post_req->($args);  
    return JSON::Syck::Load($result);
}

# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_user_lookup {
    my %OPTS = @_;

    if (!$cf_host_key) {
        $logger->info("Missing cf_host_key! Define this in $cf_config_file.");
        return [];
    }

    if ( !$has_ssl ) { 
        $logger->info("No SSL Configured");
        return [{"result"=>"error", 
                 "msg" => "CloudFlare is disabled until Net::SSLeay is installed on this server."}];
    }


    ## Otherwise, try to log this user in.
    my $login_args = {
        "host" => $cf_host_name,
        "uri" => $cf_host_uri,
        "port" => $cf_host_port,
        "query" => {
            "act" => "user_lookup",
            "host_key" => $cf_host_key,
            "cloudflare_email" => $OPTS{"email"}
        },
    };

    my $result = __https_post_req->($login_args);
    return JSON::Syck::Load($result);
}

# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_zone_set {
    my %OPTS = @_;

    if (!$cf_host_key || !$cf_host_prefix) {
        $logger->info("Missing cf_host_key or $cf_host_prefix! Define these in $cf_config_file.");
        return [];
    }

    my $domain = ".".$OPTS{"zone_name"}.".";
    my $subs = $OPTS{"subdomains"};
    $subs =~ s/${domain}//g;

    ## Unpack the mapping from recs to lines (ugg, this is SOOO BAAD)
    my $recs2lines = JSON::Syck::Load($OPTS{"cf_recs"});
    
    ## Set up the zone_set args.
    my $login_args = {
        "host" => $cf_host_name,
        "uri" => $cf_host_uri,
        "port" => $cf_host_port,
        "query" => {
            "act" => "zone_set",
            "host_key" => $cf_host_key,
            "user_key" => $OPTS{"user_key"},
            "zone_name" => $OPTS{"zone_name"},
            "resolve_to" => $cf_host_prefix . "." . $OPTS{"zone_name"},
            "subdomains" => $subs
        },
    };

    if (!$subs) {
        $login_args->{"query"}->{"act"} = "zone_delete";
    }

    my $result = JSON::Syck::Load(__https_post_req->($login_args));
    
    ## Args for updating local DNS.
    my %zone_args = ("domain" => $OPTS{"zone_name"},
                     "class" => "IN",
                     "type" => "CNAME",
                     "name" => $cf_host_prefix,
                     "ttl" => 1400,
                     "cname" => $OPTS{"zone_name"},
        );

    ## If we get an error, do nothing and return the error to the user.
    if ($result->{"result"} eq "error") {
        $logger->info("CloudFlare Error: " . $result->{"msg"});
    } else {
        ## Otherwise, update the dns for this zone.
        my $dom = ".".$OPTS{"zone_name"};
             
        ## First Make sure that the resolve to is set.
        my $res = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'ADD', 'storable', $OPTS{"zone_name"},
                                                    __serialize_request( \%zone_args ) ); 
        
        ## If there's a delete, remove this record from being CF.
        if ($OPTS{"old_line"}) {
            $zone_args{"line"} = $OPTS{"old_line"};
            $zone_args{"name"} = $OPTS{"old_rec"};
            $zone_args{"name"} =~ s/$domain//g;
            $zone_args{"cname"} = $OPTS{"zone_name"};
            $res = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                                                        __serialize_request( \%zone_args ) );
        }
        
        ## Now, go ahead and update all of the CF enabled recs.   
        foreach $ft (keys %{$result->{"response"}->{"forward_tos"}}) {
            $zone_args{"line"} = $recs2lines->{$ft."."};
            $zone_args{"name"} = $ft;
            $zone_args{"name"} =~ s/$dom//g;
            $zone_args{"cname"} = $result->{"response"}->{"forward_tos"}->{$ft};
            $res = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                                                        __serialize_request( \%zone_args ) );
        }
    }
    return $result;
}

sub api2_fetchzone {
    my $raw = __fetchzone(@_);
    my $results = [];
    my %OPTS    = @_;
    my $domain = $OPTS{'domain'}.".";

    # @TODO -- Add support for A recs here
    foreach my $res (@{$raw->{"record"}}) {   
        if (($res->{"type"} eq "CNAME") && 
            ($res->{"name"} !~ /(mail)|(cpanel)|(whm)|(ftp)|(localhost)|($cf_host_prefix)/) &&
            ($res->{"name"} ne $domain)){

            if ($res->{"cname"} =~ /cdn.cloudflare.net$/) {
                $res->{"cloudflare"} = 1;
            } else {
                $res->{"cloudflare"} = 0;
            }
            push @$results, $res; 
        }
    }
    return $results;
}

sub api2 {
    my $func = shift;

    my %API;

    $API{'user_create'}{'func'}                        = 'api2_user_create';
    $API{'user_create'}{'engine'}                      = 'hasharray';
    $API{'user_lookup'}{'func'}                        = 'api2_user_lookup';
    $API{'user_lookup'}{'engine'}                      = 'hasharray';
    $API{'zone_set'}{'func'}                           = 'api2_zone_set';
    $API{'zone_set'}{'engine'}                         = 'hasharray';
    $API{'fetchzone'}{'func'}                          = 'api2_fetchzone';
    $API{'fetchzone'}{'engine'}                        = 'hasharray';

    return ( \%{ $API{$func} } );
}

########## Internal Functions Defined Below #########

sub __fetchzone {
    my %OPTS    = @_;
    my $domain  = $OPTS{'domain'};
    my $results = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'FETCH', 'storable', $domain, ($OPTS{'customonly'} ? 1 : 0)  );

    if ( ref $results->{'record'} eq 'ARRAY' ) {
        for(0 .. $#{ $results->{'record'} }) {
            $results->{'record'}->[$_]->{'record'} = ($results->{'record'}->[$_]->{'address'} || $results->{'record'}->[$_]->{'cname'} || $results->{'record'}->[$_]->{'txtdata'});
            $results->{'record'}->[$_]->{'line'} = ($results->{'record'}->[$_]->{'Line'});
        }
        foreach my $key ( keys %KEYMAP ) {
            if ( exists $OPTS{$key} && defined $OPTS{$key} ) {
                my %MULTITYPES = map { $_ => undef } split(/[\|\,]/, $OPTS{$key});
                @{ $results->{'record'} } = grep { exists $MULTITYPES{$_->{ $KEYMAP{$key} }} } @{ $results->{'record'} };
            }
        }
    }

    return $results;
}

sub __https_post_req {
    my ( $args_hr ) = @_;
    if ($args_hr->{'port'} ne "443") {
        ## Downgrade to http
        return __http_post_req($args_hr);
    } else {
        my ( $args_hr ) = @_;
        my ($page, $response, %reply_headers)
            = post_https($args_hr->{'host'}, $args_hr->{'port'}, $args_hr->{'uri'}, '', 
                         make_form($args_hr->{'query'}));
        return $page;
    }
}

sub __http_post_req {
    my ( $args_hr ) = @_;
    my $query = $args_hr->{'query'};
    if ( ref $args_hr->{'query'} eq 'HASH' ) {
        $query = '';
        foreach my $key ( keys %{ $args_hr->{'query'} } ) {
            if ( ref $args_hr->{'query'}{$key} eq 'ARRAY' ) {
                for my $val ( @{ $args_hr->{'query'}{$key} } ) {
                    $query .=
                        $query
                        ? "&$key=" . Cpanel::Encoder::URI::uri_encode_str($val)
                        : "$key=" . Cpanel::Encoder::URI::uri_encode_str($val);
                }
            }
            else {
                $query .=
                    $query
                    ? "&$key=" . Cpanel::Encoder::URI::uri_encode_str( $args_hr->{'query'}{$key} )
                    : "$key=" . Cpanel::Encoder::URI::uri_encode_str( $args_hr->{'query'}{$key} );
            }
        }
    }
    
    my $postdata_len = length($query);
    
    my $proto = getprotobyname('tcp');
    return unless defined $proto;

    socket( my $socket_fh, &Socket::AF_INET, &Socket::SOCK_STREAM, $proto );
    return unless $socket_fh;

    my $iaddr = gethostbyname($args_hr->{'host'});
    my $port = $args_hr->{'port'};
    
    return unless ( defined $iaddr && defined $port );

    my $sin = Socket::sockaddr_in( $port, $iaddr );
    return unless defined $sin;
    
    my $result = "";
    if ( connect( $socket_fh, $sin ) ) {
        send $socket_fh, "POST /$args_hr->{'uri'} HTTP/1.0\nContent-Length: $postdata_len\nContent-Type: application/x-www-form-urlencoded\nHost: $args_hr->{'host'}\n\n$query", 0;
        
        my $in_header = 1;
        while (<$socket_fh>) {
            if ( /^\n$/ || /^\r\n$/ || /^$/ ) {
                $in_header = 0;
                next;
            }
            
            if (!$in_header) {
                $result .=  $_;
            }
        }
    }

    close $socket_fh;
    return $result;
}

sub __serialize_request {
    my $opt_ref = shift;
    my @KEYLIST;
    foreach my $opt ( keys %$opt_ref ) {
        push @KEYLIST, Cpanel::Encoder::URI::uri_encode_str($opt) . '=' . Cpanel::Encoder::URI::uri_encode_str( $opt_ref->{$opt} );
    }
    return join( '&', @KEYLIST );
}

1;
