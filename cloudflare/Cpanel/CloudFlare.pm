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
my $json_load_function;
my $json_dump_function;
my $json_loadfile_function;
my $DEFAULT_HOSTER_NAME = "your web hosting provider";

my %KEYMAP = ( 'line' => 'Line', 'ttl' => 'ttl', 'name' => 'name',
               'class' => 'class', 'address' => 'address', 'type' => 'type',
               'txtdata' => 'txtdata', 'preference' => 'preference', 'exchange' => 'exchange' );

sub CloudFlare_init {

    $json_load_function     ||= __get_json_load_function();
    $json_dump_function     ||= __get_json_dump_function();
    $json_loadfile_function ||= __get_json_loadfile_function();
    my $data = $json_loadfile_function->($cf_config_file);

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
}

sub api2_user_create {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'user_create', 'storable', %OPTS );

    if ( $result->{"result"} eq "error" ) {
        $logger->info( "CloudFlare Error: " . $result->{"msg"} );
    }
    return $result;
}

# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_user_lookup {
    my %OPTS = @_;
    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'user_lookup', 'storable', %OPTS );
    return $result;
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
    return $json_load_function->($result);
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
    return $json_load_function->($result);
}

sub api2_zone_set {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'zone_set', 'storable', %OPTS );

    __load_data_file( $OPTS{"homedir"}, $OPTS{"user"} );
    my $domain = "." . $OPTS{"zone_name"} . ".";
    my $subs   = $OPTS{"subdomains"};
    $subs =~ s/${domain}//g;

    ## Args for updating local DNS.
    my %zone_args = (
        "domain" => $OPTS{"zone_name"},
        "class"  => "IN",
        "type"   => "CNAME",
        "name"   => $cf_host_prefix,
        "ttl"    => 1400,
        "cname"  => $OPTS{"zone_name"},
    );

    my $is_cf = 0;

    ## If we get an error, do nothing and return the error to the user.
    if ( $result->{"result"} eq "error" ) {
        $logger->info( "CloudFlare Error: " . $result->{"msg"} );
    }
    else {
        ## Otherwise, update the dns for this zone.
        my $dom = "." . $OPTS{"zone_name"};

        ## First Make sure that the resolve to is set.
        my $res = Cpanel::AdminBin::adminfetchnocache(
            'zone', '', 'ADD', 'storable', $OPTS{"zone_name"},
            __serialize_request( \%zone_args )
        );

        ## If there's a delete, remove this record from being CF.
        if ( $OPTS{"old_line"} ) {
            $zone_args{"line"} = $OPTS{"old_line"};
            $zone_args{"name"} = $OPTS{"old_rec"};
            $zone_args{"name"} =~ s/$domain//g;
            $zone_args{"cname"} = $OPTS{"zone_name"};
            $res = Cpanel::AdminBin::adminfetchnocache(
                'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                __serialize_request( \%zone_args )
            );
        }

        ## Unpack the mapping from recs to lines (ugg, this is SOOO BAAD)
        my $recs2lines = $json_load_function->( $OPTS{"cf_recs"} );

        ## Now, go ahead and update all of the CF enabled recs.
        foreach my $ft ( keys %{ $result->{"response"}->{"forward_tos"} } ) {
            $zone_args{"line"} = $recs2lines->{ $ft . "." };
            $zone_args{"name"} = $ft;
            $zone_args{"name"} =~ s/$dom//g;
            $zone_args{"cname"} = $result->{"response"}->{"forward_tos"}->{$ft};

            $res = Cpanel::AdminBin::adminfetchnocache(
                'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                __serialize_request( \%zone_args )
            );
            if ( !$res->{"status"} ) {
                ## Try again, bumping up the line by 1. -- no idea why this works.
                $zone_args{"line"}++;
                $res = Cpanel::AdminBin::adminfetchnocache(
                    'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                    __serialize_request( \%zone_args )
                );
            }

            if ( !$res->{"status"} ) {
                $logger->info("Failed to set DNS for CloudFlare record $ft!");
                $logger->info( $json_dump_function->($res) );
                $result->{"result"} = "error";
                $result->{"msg"}    = $res->{"statusmsg"};
            }

            ## Note that if at least one rec is on, this zone is on CF.
            $cf_global_data->{"cf_zones"}->{ $OPTS{"zone_name"} } = 1;
            $is_cf = 1;
        }
    }

    if ( !$is_cf ) {
        $cf_global_data->{"cf_zones"}->{ $OPTS{"zone_name"} } = 0;
    }

    ## Save the updated global data arg.
    __verify_file_with_user(); 
    Cpanel::DataStore::store_ref( $cf_data_file, $cf_global_data );

    return $result;
}

sub api2_zone_delete {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'zone_delete', 'storable', %OPTS );

    __load_data_file( $OPTS{"homedir"} , $OPTS{"user"});
    my $domain = "." . $OPTS{"zone_name"} . ".";
    $cf_global_data->{"cf_zones"}->{ $OPTS{"zone_name"} } = 0;

    ## Args for updating local DNS.
    my %zone_args = (
        "domain" => $OPTS{"zone_name"},
        "class"  => "IN",
        "type"   => "CNAME",
        "name"   => $cf_host_prefix,
        "ttl"    => 1400,
        "cname"  => $OPTS{"zone_name"},
    );

    ## If we get an error, do nothing and return the error to the user.
    if ( $result->{"result"} eq "error" ) {
        $logger->info( "CloudFlare Error: " . $result->{"msg"} );
    }
    else {
        ## Otherwise, update the dns for this zone.
        my $dom = "." . $OPTS{"zone_name"};

        ## Loop over list of subs, removing from CF.
        my $res;
        foreach my $linecom ( split( /,/, $OPTS{"subdomains"} ) ) {
            my @line = split( ':', $linecom );
            $zone_args{"line"} = $line[1];
            $zone_args{"name"} = $line[0];
            $zone_args{"name"} =~ s/$domain//g;
            $zone_args{"cname"} = $OPTS{"zone_name"};
            $res = Cpanel::AdminBin::adminfetchnocache(
                'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                __serialize_request( \%zone_args )
            );
        }
    }

    
    
    ## Save the updated global data arg.
    __verify_file_with_user();
    Cpanel::DataStore::store_ref( $cf_data_file, $cf_global_data );

    return $result;
}

sub api2_fetchzone {
    my $raw = __fetchzone(@_);
    my $results = [];
    my %OPTS    = @_;    

    __load_data_file($OPTS{"homedir"} , $OPTS{"user"});
    my $domain = $OPTS{'domain'}.".";


    foreach my $res (@{$raw->{"record"}}) {
        if ((($res->{"type"} eq "CNAME") || ($res->{"type"} eq "A")) &&
            ($res->{"name"} !~ /(^autoconfig|^autodiscover|^direct|^ssh|^ftp|^ssl|^ns[^.]*|^imap[^.]*|^pop[^.]*|smtp[^.]*|^mail[^.]*|^mx[^.]*|^exchange[^.]*|^smtp[^.]*|google[^.]*|^secure|^sftp|^svn|^git|^irc|^email|^mobilemail|^pda|^webmail|^e\.|^video|^vid|^vids|^sites|^calendar|^svn|^cvs|^git|^cpanel|^panel|^repo|^webstats|^local|localhost)/) &&
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

    __verify_file_with_user();
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

sub api2_get_railguns {
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

    my $getrailgun_args = {
        "host" => $cf_user_name,
        "uri" => "/api/v2/railgun/zone_get_actives_list",
        "port" => $cf_host_port,
        "query" => {
            "tkn" => $OPTS{"user_api_key"},
            "email" => $OPTS{"user_email"},
            "z" => $OPTS{"zone_name"},
        },
    };

    my $result = __https_post_req->($getrailgun_args);
    return $json_load_function->($result);
}

sub api2_zone_get_active_railgun {
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

    my $rg_args = {
        "host" => $cf_user_name,
        "uri" => "/api/v2/railgun/zone_conn_get_active",
        "port" => $cf_host_port,
        "query" => {
            "z" => $OPTS{"zone_name"},
            "tkn" => $OPTS{"user_api_key"},
            "email" => $OPTS{"user_email"},
            "enabled" => "all",
        },
    };

    my $result = __https_post_req->($rg_args);
    return $json_load_function->($result);
}

sub api2_set_railgun {
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


    api2_remove_railgun(%OPTS);

    my $rg_args = {
        "host" => $cf_user_name,
        "uri" => "/api/v2/railgun/conn_set_by_tag",
        "port" => $cf_host_port,
        "query" => {
            "z" => $OPTS{"zone_name"},
            "tkn" => $OPTS{"user_api_key"},
            "email" => $OPTS{"user_email"},
            "tag" => $OPTS{"tag"},
            "mode" => "0",
        },
    };

    my $result = __https_post_req->($rg_args);
    return $json_load_function->($result);
}

sub api2_remove_railgun {
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

    my $stats_args = {
        "host" => $cf_user_name,
        "uri" => "/api/v2/railgun/conn_multi_delete",
        "port" => $cf_host_port,
        "query" => {
            "z" => $OPTS{"zone_name"},
            "tkn" => $OPTS{"user_api_key"},
            "email" => $OPTS{"user_email"},
        },
    };

    my $result = __https_post_req->($stats_args);
    return $json_load_function->($result);
}

sub api2_railgun_mode {
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

    my $rg_args = {
        "host" => $cf_user_name,
        "uri" => "/api/v2/railgun/conn_setmode_" . $OPTS{"mode"} . "_by_tag",
        "port" => $cf_host_port,
        "query" => {
            "z" => $OPTS{"zone_name"},
            "tkn" => $OPTS{"user_api_key"},
            "email" => $OPTS{"user_email"},
            "tag" => $OPTS{"tag"},
        },
    };

    my $result = __https_post_req->($rg_args);
    return $json_load_function->($result);
}

sub api2 {
    my $func = shift;
    $logger->info($func);
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
    $API{'get_railguns'}{'func'}                        = 'api2_get_railguns';
    $API{'get_railguns'}{'engine'}                      = 'hasharray';
    $API{'get_active_railguns'}{'func'}                 = 'api2_zone_get_active_railgun';
    $API{'get_active_railguns'}{'engine'}               = 'hasharray';
    $API{'set_railgun'}{'func'}                         = 'api2_set_railgun';
    $API{'set_railgun'}{'engine'}                       = 'hasharray';
    $API{'remove_railgun'}{'func'}                      = 'api2_remove_railgun';
    $API{'remove_railgun'}{'engine'}                    = 'hasharray';
    $API{'set_railgun_mode'}{'func'}                    = 'api2_railgun_mode';
    $API{'set_railgun_mode'}{'engine'}                  = 'hasharray';

    return ( \%{ $API{$func} } );
}

########## Internal Functions Defined Below #########
sub __load_data_file {
    my $home_dir = shift;
    my $user = shift;
    $cf_data_file = $home_dir . "/" . $cf_data_file_name;

    __verify_file_with_user();

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

sub __verify_file_with_user{
 
    if ( -l $cf_data_file )
    {
        $logger->info("Symlink found. Removing cloudflare_data.yaml");
        unlink($cf_data_file);
    }

    if ( (stat($cf_data_file))[4] != $< )
    {
        if ( -e $cf_data_file)
        {
            $logger->info("Permissions incorrect on inode. Removing cloudflare_data.yaml");
            unlink($cf_data_file);
        }
        else
        {
            $logger->info("cloudflare_data.yaml does not exist.");
        }
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
        $logger->info("Port is not 443. Wait, how did that happen?");
    } else {
        my ( $args_hr ) = @_;
        my $headers = make_headers(
            'CF-Integration' => 'cpanel',
            'CF-Integration-Version' => $cf_cp_version
        );
        my ($page, $response, %reply_headers)
            = post_https($args_hr->{'host'}, $args_hr->{'port'}, $args_hr->{'uri'}, 
                        $headers,
                        make_form(%{$args_hr->{'query'}})
            );
        if ($cf_debug_mode) {
            $logger->info("Response: " . $response);
        }
        if ($response == "HTTP/1.1 200 OK") {
            $logger->info("Error Page: " . "{\"result\":\"error\", \"msg\":\"There was an error communicating with CloudFlare. Error header received: $response\"}");
            return "{\"result\":\"error\", \"msg\":\"There was an error communicating with CloudFlare. Error header received: $response\"}";
        } else {
            $logger->info("Page: " . $page);
            return $page;
        }
    }
}

sub __serialize_request {
    my $opt_ref = shift;
    my @KEYLIST;
    foreach my $opt ( keys %$opt_ref ) {
        push @KEYLIST, Cpanel::Encoder::URI::uri_encode_str($opt) . '=' . Cpanel::Encoder::URI::uri_encode_str( $opt_ref->{$opt} );
    }
    return join( '&', @KEYLIST );
}

sub __get_json_dump_function {
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require Cpanel::JSON; };
    if ( $INC{'Cpanel/JSON.pm'} ) {
        return \&Cpanel::JSON::Dump;
    }
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require JSON::Syck; };
    if ( $INC{'JSON/Syck.pm'} ) {
        return \&JSON::Syck::Dump;
    }
    die "Failed to find JSON Dump funcition";
}

sub __get_json_load_function {
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require Cpanel::JSON; };
    if ( $INC{'Cpanel/JSON.pm'} ) {
        return \&Cpanel::JSON::Load;
    }
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require JSON::Syck; };
    if ( $INC{'JSON/Syck.pm'} ) {
        return \&JSON::Syck::Load;
    }
    die "Failed to find JSON load funcition";
}

sub __get_json_loadfile_function {
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require Cpanel::JSON; };
    if ( $INC{'Cpanel/JSON.pm'} && 'Cpanel::JSON'->can('LoadFile') ) {
        return \&Cpanel::JSON::LoadFile;
    }
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require JSON::Syck; };
    if ( $INC{'JSON/Syck.pm'} ) {
        return \&JSON::Syck::LoadFile;
    }
    die "Failed to find JSON load funcition";
}

1; # Ah, perl.
