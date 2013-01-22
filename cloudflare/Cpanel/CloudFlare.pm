package Cpanel::CloudFlare;

# cpanel - Cpanel/CloudFlare.pm                   Copyright(c) 2011 CloudFlare, Inc.
#                                                               All rights Reserved.
# copyright@cloudflare.com                                      http://cloudflare.com
# @author ian@cloudflare.com
# This code is subject to the cPanel license. Unauthorized copying is prohibited

use Cpanel::DnsUtils::UsercPanel ();
use Cpanel::AdminBin             ();
use Cpanel::Locale               ();
use Cpanel::Logger               ();
use Cpanel::UrlTools             ();
use Cpanel::SocketIP             ();
use Cpanel::Encoder::URI         ();
use Cpanel::AcctUtils            ();
use Cpanel::DomainLookup         ();
use Cpanel::DataStore            ();

use Socket                       ();
use JSON::Syck                   ();
use Digest::MD5 qw(md5_hex);
use File::Temp qw/ tempdir /;
use strict;

my $logger = Cpanel::Logger->new();
my $locale;
my $cf_config_file = "/usr/local/cpanel/etc/cloudflare.json";
my $cf_data_file_name = ".cpanel/datastore/cloudflare_data.yaml";
my $cf_old_data_file_name = "/usr/local/cpanel/etc/cloudflare_data.yaml";
my $cf_data_file;
my $cf_host_key;
my $cf_host_name;
my $cf_host_uri;
my $cf_user_name;
my $cf_user_uri;
my $cf_host_port;
my $cf_host_on_cloud_msg;
my $cf_host_prefix;
my $has_ssl;
my $cf_debug_mode;
my $hoster_name;
my $cf_cp_version;
my $cf_global_data = {};
my $DEFAULT_HOSTER_NAME = "your web hosting provider";

my %KEYMAP = ( 'line' => 'Line', 'ttl' => 'ttl', 'name' => 'name', 
               'class' => 'class', 'address' => 'address', 'type' => 'type', 
               'txtdata' => 'txtdata', 'preference' => 'preference', 'exchange' => 'exchange' );
sub CloudFlare_init { 
    my $data = JSON::Syck::LoadFile($cf_config_file);

    $cf_host_key = $data->{"host_key"};
    $cf_host_name = $data->{"host_name"};
    $cf_host_uri = $data->{"host_uri"};
    $cf_host_port = $data->{"host_port"};
    $cf_host_prefix = $data->{"host_prefix"};
    $cf_debug_mode = $data->{"debug"};
    $cf_user_name = $data->{"user_name"};
    $cf_user_uri = $data->{"user_uri"};
    $cf_cp_version = $data->{"cp_version"};
    $hoster_name = $data->{"host_formal_name"};
    $cf_host_on_cloud_msg = ($data->{"cloudflare_on_message"})? $data->{"cloudflare_on_message"}: "";
    if (!$hoster_name) {
        $hoster_name = $DEFAULT_HOSTER_NAME;
    }

    eval { use Net::SSLeay qw(post_https make_headers make_form); $has_ssl = 1 };
    if ( !$has_ssl ) {
        $logger->warn("Failed to load Net::SSLeay: $@.\nDisabling functionality until fixed.");
    }

    ## Load the api key.    
    my $response=Cpanel::AdminBin::adminrun('cf','RETRIEVE','OH_HAI');
    $response =~ s/.\n//;
    chomp $response;
    $cf_host_key = $response;
    
}

# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_user_create {
    my %OPTS = @_;

    if (!$cf_host_key) {
        $logger->info("Missing cf_host_key! Define this in $cf_config_file.");
        return [];
    }

    __load_data_file($OPTS{"homedir"});
    # Use a random string as a password.
    my $password = ($OPTS{"password"})? $OPTS{"password"}: crypt(int(rand(10000000)), time);
    $logger->info("Creating Cloudflare user for " . $OPTS{"email"});
    $cf_global_data->{"cloudflare_email"} = $OPTS{"email"};	
    $cf_global_data->{"cf_user_tokens"}->{$OPTS{"user"}} = md5_hex($OPTS{"email"} . $cf_host_key);
    $logger->info("Making user token: " . $cf_global_data->{"cf_user_tokens"}->{$OPTS{"user"}});
    
    
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
            "unique_id" => $cf_global_data->{"cf_user_tokens"}->{$OPTS{"user"}},
        },
    };

    Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data);
    
    
    
    my $result = __https_post_req->($args);  
    return JSON::Syck::Load($result);
}

# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_user_lookup {
    my %OPTS = @_;

    __load_data_file($OPTS{"homedir"}, $OPTS{"user"});
    if (!$cf_host_key) {
        $logger->info("Missing cf_host_key! Define this in $cf_config_file.");
        return [];
    }

    if ( !$has_ssl ) { 
        $logger->info("No SSL Configured");
        return [{"result"=>"error", 
                 "msg" => "CloudFlare is disabled until Net::SSLeay is installed on this server."}];
    }

    if ($cf_global_data->{"cf_user_tokens"}->{$OPTS{"user"}}) {
        if ($cf_debug_mode) {
            $logger->info("Using user token");
        }
        my $login_args = {
            "host" => $cf_host_name,
            "uri" => $cf_host_uri,
            "port" => $cf_host_port,
            "query" => {
                "act" => "user_lookup",
                "host_key" => $cf_host_key,
                "unique_id" => $cf_global_data->{"cf_user_tokens"}->{$OPTS{"user"}},
            },
        };

        my $result = JSON::Syck::Load(__https_post_req->($login_args));
        $result->{"on_cloud_message"} = $cf_host_on_cloud_msg;
        return ($result);
    } else {
        if ($cf_debug_mode) {
            $logger->info("Using user email");
        }
        my $login_args = {
            "host" => $cf_host_name,
            "uri" => $cf_host_uri,
            "port" => $cf_host_port,
            "query" => {
                "act" => "user_lookup",
                "host_key" => $cf_host_key,
                "cloudflare_email" => $cf_global_data->{"cf_email"},
            },
        };

        my $result = JSON::Syck::Load(__https_post_req->($login_args));
        $result->{"on_cloud_message"} = $cf_host_on_cloud_msg;
        return ($result);
    }
}

## Pulls certain stats for the passed in zone.
sub api2_get_stats {
    my %OPTS = @_;

    if (!$OPTS{"user_api_key"}) {
        $logger->info("Missing user_api_key!");
        return [];
    }

    if ( !$has_ssl ) { 
        $logger->info("No SSL Configured");
        return [{"result"=>"error", 
                 "msg" => "CloudFlare is disabled until Net::SSLeay is installed on this server."}];
    }

    ## Otherwise, pull this users stats.
    my $stats_args = {
        "host" => $cf_user_name,
        "uri" => $cf_user_uri,
        "port" => $cf_host_port,
        "query" => {
            "a" => "stats",
            "z" => $OPTS{"zone_name"},
            "tkn" => $OPTS{"user_api_key"},
            "u" => $OPTS{"user_email"},
            "interval" => 30, # 30 = last 7 days, 20 = last 30 days 40 = last 24 hours
        },
    };

    my $result = __https_post_req->($stats_args);
    return JSON::Syck::Load($result);
}

sub api2_edit_cf_setting {
    my %OPTS = @_;

    if (!$OPTS{"user_api_key"}) {
        $logger->info("Missing user_api_key!");
        return [];
    }

    if ( !$has_ssl ) { 
        $logger->info("No SSL Configured");
        return [{"result"=>"error", 
                 "msg" => "CloudFlare is disabled until Net::SSLeay is installed on this server."}];
    }

    ## Otherwise, pull this users stats.
    my $stats_args = {
        "host" => $cf_user_name,
        "uri" => $cf_user_uri,
        "port" => $cf_host_port,
        "query" => {
            "a" => $OPTS{"a"},
            "z" => $OPTS{"zone_name"},
            "tkn" => $OPTS{"user_api_key"},
            "u" => $OPTS{"user_email"},
            "v" => $OPTS{"v"},
        },
    };

    my $result = __https_post_req->($stats_args);
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

    __load_data_file($OPTS{"homedir"});
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
        $cf_global_data->{"cf_zones"}->{$OPTS{"zone_name"}} = 0
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

    my $is_cf = 0;

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
        foreach my $ft (keys %{$result->{"response"}->{"forward_tos"}}) {
            $zone_args{"line"} = $recs2lines->{$ft."."};
            $zone_args{"name"} = $ft;
            $zone_args{"name"} =~ s/$dom//g;
            $zone_args{"cname"} = $result->{"response"}->{"forward_tos"}->{$ft};

            $res = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                                                        __serialize_request( \%zone_args ) );
            if (!$res->{"status"}) {
                ## Try again, bumping up the line by 1. -- no idea why this works.
                $zone_args{"line"}++;
                $res = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                                                            __serialize_request( \%zone_args ) );
            }

            if (!$res->{"status"}) {
                $logger->info("Failed to set DNS for CloudFlare record $ft!");
                $logger->info(JSON::Syck::Dump($res));
                $result->{"result"} = "error";
                $result->{"msg"} = $res->{"statusmsg"};
            }

            ## Note that if at least one rec is on, this zone is on CF.
            $cf_global_data->{"cf_zones"}->{$OPTS{"zone_name"}} = 1;
            $is_cf = 1;   
        }
    }

    if (!$is_cf) {
       $cf_global_data->{"cf_zones"}->{$OPTS{"zone_name"}} = 0;
    }

    ## Save the updated global data arg.
    Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data);

    return $result;
}

sub api2_zone_delete {
    my %OPTS = @_;

    if (!$cf_host_key || !$cf_host_prefix) {
        $logger->info("Missing cf_host_key or $cf_host_prefix! Define these in $cf_config_file.");
        return [];
    }

    __load_data_file($OPTS{"homedir"});
    my $domain = ".".$OPTS{"zone_name"}.".";

    ## Unpack the mapping from recs to lines (ugg, this is SOOO BAAD)
    my $recs2lines = JSON::Syck::Load($OPTS{"cf_recs"});
    
    ## Set up the zone_set args.
    my $login_args = {
        "host" => $cf_host_name,
        "uri" => $cf_host_uri,
        "port" => $cf_host_port,
        "query" => {
            "act" => "zone_delete",
            "host_key" => $cf_host_key,
            "user_key" => $OPTS{"user_key"},
            "zone_name" => $OPTS{"zone_name"}
        },
    };

    $cf_global_data->{"cf_zones"}->{$OPTS{"zone_name"}} = 0;

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
             
        ## Loop over list of subs, removing from CF.
        my $res;
        foreach my $linecom (split(/,/, $OPTS{"subdomains"})) {
            my @line = split(':', $linecom);
            $zone_args{"line"} = $line[1];
            $zone_args{"name"} = $line[0];
            $zone_args{"name"} =~ s/$domain//g;
            $zone_args{"cname"} = $OPTS{"zone_name"};
            $res = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                                                        __serialize_request( \%zone_args ) );
        }
    }

    ## Save the updated global data arg.
    Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data);

    return $result;
}

sub api2_fetchzone {
    my $raw = __fetchzone(@_);
    my $results = [];
    my %OPTS    = @_;
    
    __load_data_file($OPTS{"homedir"});
    my $domain = $OPTS{'domain'}.".";

    foreach my $res (@{$raw->{"record"}}) {
        if ((($res->{"type"} eq "CNAME") || ($res->{"type"} eq "A")) &&
            ($res->{"name"} !~ /(^direct|^ssh|^ftp|^ssl|^ns[^.]*|^imap[^.]*|^pop[^.]*|smtp[^.]*|^mail[^.]*|^mx[^.]*|^exchange[^.]*|^smtp[^.]*|google[^.]*|^secure|^sftp|^svn|^git|^irc|^email|^mobilemail|^pda|^webmail|^e\.|^video|^vid|^vids|^sites|^calendar|^svn|^cvs|^git|^cpanel|^panel|^repo|^webstats|^local|localhost)/) &&
            ($res->{"name"} ne $domain) &&
	    ($res->{"name"} ne $cf_host_prefix .".". $domain) &&
            ($res->{"cname"} !~ /google.com/)){
            if ($res->{"cname"} =~ /cdn.cloudflare.net$/) {
                $res->{"cloudflare"} = 1;
                $cf_global_data->{"cf_zones"}->{$OPTS{'domain'}} = 1;
            } else {
                $res->{"cloudflare"} = 0;
	    }
            push @$results, $res; 
        }
    }
    
    Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data);
    
    return $results;
    
}

sub api2_getbasedomains {        
    my %OPTS = @_;
    __load_data_file($OPTS{"homedir"}, $OPTS{"user"});
    my $res = Cpanel::DomainLookup::api2_getbasedomains(@_);
    my $has_cf = 0;
    foreach my $dom (@$res) {
        if ($cf_global_data->{"cf_zones"}->{$dom->{"domain"}}) {
            $dom->{"cloudflare"} = 1;
            $has_cf = 1;
        } else {
            $dom->{"cloudflare"} = 0;
        }
    }
    return {"has_cf" => $has_cf, "res" => $res, "hoster" => $hoster_name};
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
    $API{'zone_delete'}{'func'}                        = 'api2_zone_delete';
    $API{'zone_delete'}{'engine'}                      = 'hasharray';
    $API{'fetchzone'}{'func'}                          = 'api2_fetchzone';
    $API{'fetchzone'}{'engine'}                        = 'hasharray';
    $API{'getbasedomains'}{'func'}                     = 'api2_getbasedomains';
    $API{'getbasedomains'}{'engine'}                   = 'hasharray';
    $API{'zone_get_stats'}{'func'}                     = 'api2_get_stats';
    $API{'zone_get_stats'}{'engine'}                   = 'hasharray';
    $API{'zone_edit_cf_setting'}{'func'}               = 'api2_edit_cf_setting';
    $API{'zone_edit_cf_setting'}{'engine'}             = 'hasharray';

    return ( \%{ $API{$func} } );
}

## Run the auto-update here
sub check_auto_update {

    print "Checking CloudFlare for latest version\n";
    CloudFlare_init();
    print "Current Version: $cf_cp_version\n";

    my $check_args = {
        "host" => $cf_host_name,
        "uri" => $cf_host_uri,
        "port" => $cf_host_port,
        "query" => {
            "host_key" => $cf_host_key,
            "act"      => "cpanel_info",
            "host_key" => $cf_host_key,
        },
    };

    my $result = JSON::Syck::Load(__https_post_req->($check_args));

    if ($result->{"result"} eq "error") {
        print "Error: " . $result->{"msg"}. "\n";
        exit -10;
    }

    print "Latest Version: " . $result->{"response"}{"cpanel_latest"} . "\n";
    print "Latest SHA1: " . $result->{"response"}{"cpanel_sha1"} . "\n";

    if ($result->{"response"}{"cpanel_latest"} > $cf_cp_version) {
        print "Downloading the latest version.\n";
        my $dir = tempdir( CLEANUP => 0 );
        `curl -k -L https://github.com/cloudflare/CloudFlare-CPanel/tarball/master > $dir/cloudflare.tar.gz`;
        if (`sha1sum $dir/cloudflare.tar.gz | grep $result->{"response"}{"cpanel_sha1"}`) {
            print "$dir\n";
        } else {
            print "Checksum failed, aborting upgrade\n";
            unlink("$dir/cloudflare.tar.gz");
            rmdir($dir);
        }
    } else {
        print "You already have the latest version.\n";
    }
}

## Returns a list of all users and zones on CF.
sub list_active_zones {
    if ($>) {
        die("must be root to run.");
    }

    CloudFlare_init();
    my %zones;
    foreach my $user (`ls /home`) {
        chomp $user;
        if ( -e "/home/$user/$cf_data_file_name") {
            __load_data_file("/home/$user", $user);
            foreach my $zone (keys %{$cf_global_data->{"cf_zones"}}) {
                if ($cf_global_data->{"cf_zones"}{$zone}) {
                    $zones{$zone} = 1;
                }
            }
        }
    }

    print "The following zones are currently active on CloudFlare:\n";
    foreach my $zone (keys %zones) {
        print "$zone\n";
    }
}

########## Internal Functions Defined Below #########

sub __load_data_file {
    my $home_dir = shift;
    my $user = shift;
    $cf_data_file = $home_dir . "/" . $cf_data_file_name;    
    if( Cpanel::DataStore::load_ref($cf_data_file, $cf_global_data ) ) {
        if ($cf_debug_mode) {
            $logger->info("Successfully loaded cf data -- $cf_data_file");
        }
    } else {
        ## Try to load the data from the old default data file (if it exists)
        if (-e $cf_old_data_file_name) {
            $logger->info( "Failed to load cf data -- Trying to copy from $cf_old_data_file_name for $user");
            my $tmp_data = {};
            Cpanel::DataStore::load_ref($cf_old_data_file_name, $tmp_data);
            $cf_global_data->{"cf_user_tokens"}->{$user} = $tmp_data->{"cf_user_tokens"}->{$user};
            $cf_global_data->{"cf_zones"} = $tmp_data->{"cf_zones"};

        } else {
            $cf_global_data = {"cf_zones" => {}};
            $logger->info( "Failed to load cf data -- storing blank data at $cf_data_file");
        }
        Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data);
        chmod 0600, $cf_data_file;
    }
}

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
                         make_form(%{$args_hr->{'query'}}));
        if ($cf_debug_mode) {
            $logger->info($response);
            $logger->info($page);
        }
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

    if ($cf_debug_mode) {
        $logger->info($query);
    }    

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

    if ($cf_debug_mode) {
        $logger->info($result);
    }

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

## Are we running from the command line?
if ($ARGV[0] eq "check") {
    check_auto_update();
} elsif ($ARGV[0] eq "list") {
    list_active_zones();
}

1; # Ah, perl.
