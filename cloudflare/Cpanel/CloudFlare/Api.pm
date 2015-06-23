package Cpanel::CloudFlare::Api;

use Cpanel::Logger();
use Cpanel::CloudFlare::Config();
use Cpanel::CloudFlare::Helper();
use Cpanel::CloudFlare::Host();
use Cpanel::CloudFlare::User();

my $logger = Cpanel::Logger->new();

## Helper variables
my $initialized = false;
my $has_ssl;
my $json_load_function ||= Cpanel::CloudFlare::Helper::__get_json_load_function();

sub init {
    ## only initialize once
    if ( $initialized ) {
        return true;
    }

    eval { use Net::SSLeay qw(post_https make_headers make_form); $has_ssl = 1 };
    if ( !$has_ssl ) {
        $logger->warn("Failed to load Net::SSLeay: $@.\nDisabling functionality until fixed.");
        return false;
    }

    return $initialized = true;
}

sub client_api_request {
    my ( $query ) = @_;

    $base = Cpanel::CloudFlare::Config::get_client_api_base();
    $base->{"query"} = $query;
    $base->{"query"}->{"tkn"} = Cpanel::CloudFlare::User::get_user_api_key();

    return cf_api_request($base);
}

sub railgun_api_request {
    my $uri = shift;
    my ( $query ) = @_;

    $base = Cpanel::CloudFlare::Config::get_client_api_base();
    $base->{"uri"} = $uri;
    $base->{"query"} = $query;
    $base->{"query"}->{"tkn"} = Cpanel::CloudFlare::User::get_user_api_key();

    return cf_api_request($base);
}

sub host_api_request {
    my ( $query ) = @_;

    $base = Cpanel::CloudFlare::Config::get_host_api_base();
    $base->{"query"} = $query;

    $base->{'query'}->{'host_key'} = Cpanel::CloudFlare::Host::get_host_api_key();

    return cf_api_request($base);
}

sub cf_api_request {
    my ( $args_hr ) = @_;
    $result = https_post_request($args_hr);
    return $json_load_function->($result);
}

sub https_post_request {
    my ( $args_hr ) = @_;

    ## All requests will require SSLeay, so bail if that does not exist
    if (!init()) {
        return [{"result"=>"error", "msg" => "CloudFlare is disabled until Net::SSLeay is installed on this server."}];
    }

    if ($args_hr->{'port'} ne "443") {
        ## Downgrade to http
        $logger->warn("Attempted to make call on non SSL Port");
        return [{"result"=>"error", "msg" => "Plugin attempted to call CloudFlare on incorrect port: " . $args_hr->{'port'}}];
    }

    my $headers = make_headers(
        'CF-Integration' => 'cpanel',
        'CF-Integration-Version' => Cpanel::CloudFlare::Config::get_plugin_version()
    );
    my ($page, $response, %reply_headers)
        = post_https($args_hr->{'host'}, $args_hr->{'port'}, $args_hr->{'uri'},
                    $headers,
                    make_form(%{$args_hr->{'query'}})
        );
    if (Cpanel::CloudFlare::Config::is_debug_mode()) {
        $logger->info("Response: " . $response);
    }

    if ($response != "HTTP/1.1 200 OK") {
        $logger->info("Error Page: " . "{\"result\":\"error\", \"msg\":\"There was an error communicating with CloudFlare. Error header received: $response\"}");
        return "{\"result\":\"error\", \"msg\":\"There was an error communicating with CloudFlare. Error header received: $response\"}";
    } else {
        if (Cpanel::CloudFlare::Config::is_debug_mode()) {
            $logger->info("Page: " . $page);
        }
        return $page;
    }
}

1;
