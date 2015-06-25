package Cpanel::CloudFlare;

# cpanel - Cpanel/CloudFlare.pm                   Copyright(c) 2011 CloudFlare, Inc.
#                                                               All rights Reserved.
# copyright@cloudflare.com                                      http://cloudflare.com
# @author ian@cloudflare.com
# This code is subject to the cPanel license. Unauthorized copying is prohibited

use Cpanel::AdminBin             ();
use Cpanel::Logger               ();
use Cpanel::DomainLookup         ();

use Cpanel();

use Cpanel::CloudFlare::Api();
use Cpanel::CloudFlare::Helper();
use Cpanel::CloudFlare::UserStore();

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

## START Client API v4 Entry Points

sub api2_get_settings {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::client_api_request_v4('GET', "/zones/", {
        #"z" => $OPTS{"zone_name"},
       # "u" => $OPTS{"user_email"}
    });
}

## END Client API v4 Entry Points

## Pulls certain stats for the passed in zone.
sub api2_get_stats {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::client_api_request_v1({
        "a" => "stats",
        "z" => $OPTS{"zone_name"},
        "u" => $OPTS{"user_email"},
        "interval" => 30, # 30 = last 7 days, 20 = last 30 days 40 = last 24 hours
    });
}

sub api2_edit_cf_setting {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::client_api_request_v1({
        "a" => $OPTS{"a"},
        "z" => $OPTS{"zone_name"},
        "u" => $OPTS{"user_email"},
        "v" => $OPTS{"v"}
    });
}

sub api2_zone_set {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'zone_set', 'storable', %OPTS );

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file( $OPTS{"homedir"}, $OPTS{"user"} );
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

sub api2_zone_delete {
    my %OPTS = @_;

    my $result = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'zone_delete', 'storable', %OPTS );

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file( $OPTS{"homedir"} , $OPTS{"user"});
    my $domain = "." . $OPTS{"zone_name"} . ".";
    $cf_global_data->{"cf_zones"}->{ $OPTS{"zone_name"} } = 0;

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
                Cpanel::CloudFlare::Helper::__serialize_request( \%zone_args )
            );
        }
    }

    
    
    ## Save the updated global data arg.
    Cpanel::CloudFlare::UserStore::__verify_file_with_user();
    Cpanel::CloudFlare::UserStore::__save_data_file($cf_global_data);

    return $result;
}

sub api2_fetchzone {
    my $raw = __fetchzone(@_);
    my $results = [];
    my %OPTS    = @_;    

    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file($OPTS{"homedir"} , $OPTS{"user"});
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
    $cf_global_data = Cpanel::CloudFlare::UserStore::__load_data_file($OPTS{"homedir"}, $OPTS{"user"});
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
        "email" => $OPTS{"user_email"},
        "z" => $OPTS{"zone_name"}
    });
}

sub api2_zone_get_active_railgun {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/zone_conn_get_active", {
        "z" => $OPTS{"zone_name"},
        "email" => $OPTS{"user_email"},
        "enabled" => "all"
    });
}

sub api2_set_railgun {
    my %OPTS = @_;

    api2_remove_railgun(%OPTS);

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/conn_set_by_tag", {
        "z" => $OPTS{"zone_name"},
        "email" => $OPTS{"user_email"},
        "tag" => $OPTS{"tag"},
        "mode" => "0",
    });
}

sub api2_remove_railgun {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/conn_multi_delete", {
       "z" => $OPTS{"zone_name"},
       "email" => $OPTS{"user_email"},
    });
}

sub api2_railgun_mode {
    my %OPTS = @_;

    return Cpanel::CloudFlare::Api::railgun_api_request("/api/v2/railgun/conn_setmode_" . $OPTS{"mode"} . "_by_tag", {
       "z" => $OPTS{"zone_name"},
       "email" => $OPTS{"user_email"},
       "tag" => $OPTS{"tag"},
    });
}

sub api2 {
    my $func = shift;
    $logger->info($func);
    my %API;

    ## Load the current user so it is available to other requests
    Cpanel::CloudFlare::User::load($Cpanel::homedir , $Cpanel::CPDATA{'USER'});

    if (Cpanel::CloudFlare::Config::is_debug_mode()) {
        $logger->info("User: " . Dumper($Cpanel::CPDATA{'USER'}));
        $logger->info("Homedir: " . Dumper($Cpanel::homedir));
    }

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
    $API{'zone_get_settings'}{'func'}                  = 'api2_get_settings';
    $API{'zone_get_settings'}{'engine'}                = 'hasharray';
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
