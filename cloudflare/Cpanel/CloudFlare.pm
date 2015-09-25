package Cpanel::CloudFlare;

# cpanel - Cpanel/CloudFlare.pm                   Copyright(c) 2011 CloudFlare, Inc.
#                                                               All rights Reserved.
# copyright@cloudflare.com                                      http://cloudflare.com
# @author ian@cloudflare.com
# This code is subject to the cPanel license. Unauthorized copying is prohibited

use Cpanel::AdminBin             ();
use Cpanel::Logger               ();
use Cpanel::DomainLookup         ();

use Cpanel::CloudFlare::Api();
use Cpanel::CloudFlare::Helper();
use Cpanel::CloudFlare::User();
use Cpanel::CloudFlare::UserStore();
use Cpanel::CloudFlare::Zone();

## Data::Dumper is only needed within debug mode
## Some hosts do not have this installed
if (Cpanel::CloudFlare::Config::is_debug_mode()) {
    use Data::Dumper;
}

use strict;

my $logger = Cpanel::Logger->new();
my $cf_data_file;
my $cf_global_data = {};
my $json_dump_function;
my $json_load_function;

my %KEYMAP = ( 'line' => 'Line', 'ttl' => 'ttl', 'name' => 'name',
               'class' => 'class', 'address' => 'address', 'type' => 'type',
               'txtdata' => 'txtdata', 'preference' => 'preference', 'exchange' => 'exchange' );

sub CloudFlare_init {
    $json_dump_function     ||= Cpanel::CloudFlare::Helper::__get_json_dump_function();
    $json_load_function     ||= Cpanel::CloudFlare::Helper::__get_json_load_function();
}

sub api2_user_create {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'user_create', 'storable', (%OPTS, 'homedir', $Cpanel::homedir, 'user' , $Cpanel::CPDATA{'USER'}) );

    if ( $result->{"result"} eq "error" ) {
        $logger->info( "CloudFlare Error: " . $result->{"msg"} );
    }
    return $result;
}

# Can only be called with json or xml api because it uses
# a non-standard return
sub api2_user_lookup {
    my %OPTS = @_;
    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'user_lookup', 'storable', (%OPTS, 'homedir', $Cpanel::homedir, 'user' , $Cpanel::CPDATA{'USER'}) );
    return $result;
}

## START Client API v4 Entry Points

sub api2_get_zone_settings {
    my %OPTS = @_;

    if (!$OPTS{"zone_name"}) {
        die "Missing required parameter 'zone_name'.\n";
    }

    my $zone_tag = Cpanel::CloudFlare::Zone::get_zone_tag($OPTS{"zone_name"});

    return Cpanel::CloudFlare::Api::client_api_request_v4('GET', "/zones/" . $zone_tag . "/settings", {});
}

sub api2_patch_zone_setting {
    my %OPTS = @_;

    if (!$OPTS{"zone_name"}) {
        die "Missing required parameter 'zone_name'.\n";
    }

    if (!$OPTS{"setting"}) {
        die "Missing required parameter 'setting'.\n";
    }

    if (!$OPTS{"value"}) {
        die "Missing required parameter 'value'.\n";
    }

    my $zone_tag = Cpanel::CloudFlare::Zone::get_zone_tag($OPTS{"zone_name"});

    return Cpanel::CloudFlare::Api::client_api_request_v4('PATCH', "/zones/" . $zone_tag . "/settings", {"value" => $OPTS{"value"}});
}

sub api2_get_zone_analytics {
    # TODO: Pending release of v4 analytics endpoint
}

sub api2_post_create_dns_record {
    my %OPTS = @_;

    my $cf_user_store = Cpanel::CloudFlare::UserStore->new();

    if (!$OPTS{"zone_tag"}) {
        die "Missing required parameter 'zone_tag'.\n";
    }

    if (!$OPTS{"type"}) {
        die "Missing required parameter 'type'.\n";
    }

    if (!$OPTS{"name"}) {
        die "Missing required parameter 'name'.\n";
    }

    if (!$OPTS{"content"}) {
        die "Missing required parameter 'content'.\n";
    }

    return Cpanel::CloudFlare::Api::client_api_request_v4('POST', "/zones/" . $OPTS{"zone_tag"} . "/dns_records", {"type" => $OPTS{"type"}, "name" => $OPTS{"name"}, "content" => $OPTS{"content"}});
}

## END Client API v4 Entry Points

## Pulls certain stats for the passed in zone.
## TODO: Remove these methods once the plugin has been updated to use v4 of the client api
sub api2_get_stats {
    my %OPTS = @_;

    my $result = Cpanel::CloudFlare::Api::client_api_request_v1({
        "a" => "stats",
        "z" => $OPTS{"zone_name"},
        "u" => Cpanel::CloudFlare::User::get_user_email(),
        "interval" => 30, # 30 = last 7 days, 20 = last 30 days 40 = last 24 hours
    });

    ## We're out of sync! Clean the zone up to be off CloudFlare
    if ($result->{"result"} eq "error" && ($result->{"err_code"} eq "err_zone_not_found" || $result->{"err_code"} eq "err_zone")) {
        rec_cleanup(%OPTS);
        die "This domain no longer appears to be on CloudFlare. Please reactivate CloudFlare before managing settings.\n";
    }

    return $result;
}

sub api2_edit_cf_setting {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::client_api_request_v1({
        "a" => $OPTS{"a"},
        "z" => $OPTS{"zone_name"},
        "u" => Cpanel::CloudFlare::User::get_user_email(),
        "v" => $OPTS{"v"}
    });
}

sub api2_zone_set {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'zone_set', 'storable', (%OPTS, 'user_key', Cpanel::CloudFlare::User::get_user_key(), 'homedir', $Cpanel::homedir, 'user' , $Cpanel::CPDATA{'USER'}) );

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file( $Cpanel::homedir , $Cpanel::CPDATA{'USER'} );
    my $domain = "." . $OPTS{"zone_name"} . ".";
    my $subs   = $OPTS{"subdomains"};
    $subs =~ s/${domain}//g;

    ## Args for updating local DNS.
    my %zone_args = (
        "domain" => $OPTS{"zone_name"},
        "class"  => "IN",
        "type"   => "CNAME",
        "name"   => Cpanel::CloudFlare::Config::get_host_prefix(),
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
            Cpanel::CloudFlare::Helper::__serialize_request( \%zone_args )
        );

        ## If there's a delete, remove this record from being CF.
        if ( $OPTS{"old_line"} ) {
            $zone_args{"line"} = $OPTS{"old_line"};
            $zone_args{"name"} = $OPTS{"old_rec"};
            $zone_args{"name"} =~ s/$domain//g;
            $zone_args{"cname"} = $OPTS{"zone_name"};
            $res = Cpanel::AdminBin::adminfetchnocache(
                'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                Cpanel::CloudFlare::Helper::__serialize_request( \%zone_args )
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
                Cpanel::CloudFlare::Helper::__serialize_request( \%zone_args )
            );
            if ( !$res->{"status"} ) {
                ## Try again, bumping up the line by 1. -- no idea why this works.
                $zone_args{"line"}++;
                $res = Cpanel::AdminBin::adminfetchnocache(
                    'zone', '', 'EDIT', 'storable', $OPTS{"zone_name"},
                    Cpanel::CloudFlare::Helper::__serialize_request( \%zone_args )
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
    Cpanel::CloudFlare::UserStore::__verify_file_with_user();
    Cpanel::CloudFlare::UserStore::__save_data_file($cf_global_data);

    return $result;
}

sub api2_full_zone_set {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'full_zone_set', 'storable', (%OPTS, 'user_key', Cpanel::CloudFlare::User::get_user_key(), 'homedir', $Cpanel::homedir, 'user' , $Cpanel::CPDATA{'USER'}) );

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file( $Cpanel::homedir , $Cpanel::CPDATA{'USER'} );
    my $domain = "." . $OPTS{"zone_name"} . ".";
    my $subs   = $OPTS{"subdomains"};
    $subs =~ s/${domain}//g if defined $subs;

    ## Args for updating local DNS.
    my %zone_args = (
        "domain" => $OPTS{"zone_name"},
        "class"  => "IN",
        "type"   => "CNAME",
        "name"   => Cpanel::CloudFlare::Config::get_host_prefix(),
        "ttl"    => 1400,
        "cname"  => $OPTS{"zone_name"},
    );

    ## If we get an error, do nothing and return the error to the user.
    if ( $result->{"result"} eq "error" ) {
        $logger->info( "CloudFlare Error: " . $result->{"msg"} );
        return $result;
    } else {
        # Sync DNS Records to CloudFlare
        my $zone_record_results = Cpanel::AdminBin::adminfetchnocache( 'zone', '', 'FETCH', 'storable', $OPTS{"zone_name"}, 0  );

        if ( ref $zone_record_results->{'record'} eq 'ARRAY' ) {
            my $zone_tag = Cpanel::CloudFlare::Zone::get_zone_tag($OPTS{"zone_name"});
            # excludes SOA, NS, RAW record types
            my %accepted_zone_types = (A => 'A', AAAA => 'AAAA', CNAME => 'CNAME', MX => 'MX', TXT => 'TXT');

            for(0 .. $#{ $zone_record_results->{'record'} }) {
                my $record = $zone_record_results->{'record'}->[$_];

                if(exists($accepted_zone_types{$record->{'type'}})) {
                    my $content = "";

                    if($record->{'type'} eq "MX") {
                        $content = $record->{'exchange'};
                    }
                    elsif($record->{'type'} eq "CNAME") {
                        $content = $record->{'cname'};
                    }
                    elsif($record->{'type'} eq "TXT") {
                        $content = $record->{'txtdata'};
                    }
                    elsif($record->{'type'} eq "A" || $record->{'type'} eq "AAAA") {
                        $content = $record->{'address'};
                    }

                    my $create_dns_record_result = api2_post_create_dns_record("zone_tag", $zone_tag, "type", $record->{'type'}, "name", $record->{'name'}, "content", $content);

                    ## If we get an error, do nothing and return the error to the user.
                    if ( $create_dns_record_result->{"result"} eq "error" ) {
                        $logger->info( "CloudFlare Error: " . $create_dns_record_result->{"msg"} );
                    }
                }
            }
         }
    }

    ## Save the updated global data arg.
    Cpanel::CloudFlare::UserStore::__verify_file_with_user();
    Cpanel::CloudFlare::UserStore::__save_data_file($cf_global_data);

    return $result;
}

sub api2_zone_delete {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'zone_delete', 'storable', (%OPTS, 'user_key', Cpanel::CloudFlare::User::get_user_key(), 'homedir', $Cpanel::homedir, 'user' , $Cpanel::CPDATA{'USER'}) );

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file( $Cpanel::homedir , $Cpanel::CPDATA{'USER'});
    $cf_global_data->{"cf_zones"}->{ $OPTS{"zone_name"} } = 0;

    ## If we get an error, do nothing and return the error to the user.
    if ( $result->{"result"} eq "error" ) {
        $logger->info( "CloudFlare Error: " . $result->{"msg"} );
    } else {
        ## Otherwise, update the dns for this zone.
        rec_cleanup(%OPTS);
    }
    
    ## Save the updated global data arg.
    Cpanel::CloudFlare::UserStore::__verify_file_with_user();
    Cpanel::CloudFlare::UserStore::__save_data_file($cf_global_data);

    return $result;
}

# Remove any zones that are on CloudFlare
sub rec_cleanup {
    my %OPTS = @_;

    my $domain = "." . $OPTS{"zone_name"} . ".";
    my $dom = "." . $OPTS{"zone_name"};

    ## Args for updating local DNS.
    my %zone_args = (
        "domain" => $OPTS{"zone_name"},
        "class"  => "IN",
        "type"   => "CNAME",
        "name"   => Cpanel::CloudFlare::Config::get_host_prefix(),
        "ttl"    => 1400,
        "cname"  => $OPTS{"zone_name"},
    );

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
            Cpanel::CloudFlare::Helper::__serialize_request( \%zone_args )
        );
    }
}

sub api2_fetchzone {
    my $raw = __fetchzone(@_);
    my $results = [];
    my %OPTS    = @_;    

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file($Cpanel::homedir , $Cpanel::CPDATA{'USER'});
    my $domain = $OPTS{'domain'}.".";


    foreach my $res (@{$raw->{"record"}}) {
        if (
            (($res->{"type"} eq "CNAME") || ($res->{"type"} eq "A")) &&
            ($res->{"name"} !~ /(^autoconfig|^autodiscover|^direct|^ssh|^ftp|^ssl|^ns[^.]*|^imap[^.]*|^pop[^.]*|smtp[^.]*|^mail[^.]*|^mx[^.]*|^exchange[^.]*|^smtp[^.]*|google[^.]*|^secure|^sftp|^svn|^git|^irc|^email|^mobilemail|^pda|^webmail|^e\.|^video|^vid|^vids|^sites|^calendar|^svn|^cvs|^git|^cpanel|^panel|^repo|^webstats|^local|localhost)/) &&
            ($res->{"name"} ne $domain) &&
	        ($res->{"name"} ne Cpanel::CloudFlare::Config::get_host_prefix() .".". $domain) &&
            ($res->{"cname"} !~ /google.com/)
        ){
            if ($res->{"cname"} =~ /cdn.cloudflare.net$/) {
                $res->{"cloudflare"} = 1;
                $cf_global_data->{"cf_zones"}->{$OPTS{'domain'}} = 1;
            } else {
                $res->{"cloudflare"} = 0;
	    }
            push @$results, $res;
        }
    }

    Cpanel::CloudFlare::UserStore::__verify_file_with_user();
    Cpanel::CloudFlare::UserStore::__save_data_file($cf_global_data);

    return $results;
}

sub api2_getbasedomains {
    my %OPTS = @_;
    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file($Cpanel::homedir , $Cpanel::CPDATA{'USER'});
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
    return {"has_cf" => $has_cf, "res" => $res, "hoster" => Cpanel::CloudFlare::Config::get_host_formal_name()};
}

sub api2_get_railguns {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/zone_get_actives_list", {
        "email" => Cpanel::CloudFlare::User::get_user_email(),
        "z" => $OPTS{"zone_name"}
    });
}

sub api2_zone_get_active_railgun {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/zone_conn_get_active", {
        "z" => $OPTS{"zone_name"},
        "email" => Cpanel::CloudFlare::User::get_user_email(),
        "enabled" => "all"
    });
}

sub api2_set_railgun {
    my %OPTS = @_;

    api2_remove_railgun(%OPTS);

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/conn_set_by_tag", {
        "z" => $OPTS{"zone_name"},
        "email" => Cpanel::CloudFlare::User::get_user_email(),
        "tag" => $OPTS{"tag"},
        "mode" => "0",
    });
}

sub api2_remove_railgun {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/conn_multi_delete", {
       "z" => $OPTS{"zone_name"},
       "email" => Cpanel::CloudFlare::User::get_user_email(),
    });
}

sub api2_railgun_mode {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/conn_setmode_" . $OPTS{"mode"} . "_by_tag", {
       "z" => $OPTS{"zone_name"},
       "email" => Cpanel::CloudFlare::User::get_user_email(),
       "tag" => $OPTS{"tag"},
    });
}

{
    # static action storage to allow us to map all functions call to a universal sub while tracking to multiple functions ultimately
    my $action;

    sub api2 {
        $action = shift;
        $logger->info($action);

        return ( \%{ {'func' => 'api2_front_controller', 'engine' => 'hasharray'} } );
    }

    sub api2_front_controller {
        ## Load the current user so it is available to other requests
        Cpanel::CloudFlare::User::load($Cpanel::homedir , $Cpanel::CPDATA{'USER'});

        if (Cpanel::CloudFlare::Config::is_debug_mode()) {
            $logger->info("User: " . Dumper($Cpanel::CPDATA{'USER'}));
            $logger->info("Homedir: " . Dumper($Cpanel::homedir));
        }

        my %API;
        my %OPTS = @_;

        $API{'user_create'}                       = 'api2_user_create';
        $API{'user_lookup'}                       = 'api2_user_lookup';
        $API{'zone_set'}                          = 'api2_zone_set';
        $API{'full_zone_set'}                     = 'api2_full_zone_set';
        $API{'zone_delete'}                       = 'api2_zone_delete';
        $API{'fetchzone'}                         = 'api2_fetchzone';
        $API{'getbasedomains'}                    = 'api2_getbasedomains';
        $API{'zone_get_stats'}                    = 'api2_get_stats';
        $API{'zone_get_settings'}                 = 'api2_get_zone_settings';
        $API{'zone_edit_cf_setting'}              = 'api2_edit_cf_setting';
        $API{'get_railguns'}                      = 'api2_get_railguns';
        $API{'get_active_railguns'}               = 'api2_zone_get_active_railgun';
        $API{'set_railgun'}                       = 'api2_set_railgun';
        $API{'remove_railgun'}                    = 'api2_remove_railgun';
        $API{'set_railgun_mode'}                  = 'api2_railgun_mode';

        my $response;
        eval {
            ## DNS Records can't be managed properly without this, so require this for any action
            if (!main::hasfeature('zoneedit')) {
                die "CloudFlare cPanel Plugin configuration issue! Please contact your hosting provider to enable \"Advanced DNS Zone Editor\".\n";
            }

            # nasty way to call a method based on a string...
            $response = &{\&{$API{$action}}}(%OPTS);
        };
        if ($@) {
            if (Cpanel::CloudFlare::Config::is_debug_mode()) {
                $logger->warn("Exception caught: " . Dumper($@));
            }

            return [
                {
                    "result" => "error",
                    "msg"    => $@
                }
            ];
        }

        return $response;
    }
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

1; # Ah, perl.
