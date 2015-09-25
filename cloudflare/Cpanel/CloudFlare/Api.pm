package Cpanel::CloudFlare::Api;

use Cpanel::Logger();
use Cpanel::CloudFlare::Config();
use Cpanel::CloudFlare::Helper();
use Cpanel::CloudFlare::Host();
use Cpanel::CloudFlare::User();

## Data::Dumper is only needed within debug mode
## Some hosts do not have this installed
if (Cpanel::CloudFlare::Config::is_debug_mode()) {
    use Data::Dumper;
}

use HTTP::Request::Common;
require HTTP::Headers;
require HTTP::Request;
require LWP::UserAgent;

my $logger = Cpanel::Logger->new();

## Helper variables
my $has_ssl;
my $json_load_function ||= Cpanel::CloudFlare::Helper::__get_json_load_function();
my $json_dump_function ||= Cpanel::CloudFlare::Helper::__get_json_dump_function();

sub client_api_request_v1 {
    my ( $query ) = @_;

    $base = Cpanel::CloudFlare::Config::get_client_api_base();
    $base->{"query"} = $query;
    $base->{"query"}->{"tkn"} = Cpanel::CloudFlare::User::get_user_api_key();

    return cf_api_request($base);
}

sub client_api_request_v4 {
    my $method = shift;
    my $uri = shift;
    my ( $query ) = @_;

    $base = Cpanel::CloudFlare::Config::get_client_api_base_v4();
    $base->{"method"} = $method;
    $base->{"query"} = $query;
    $base->{"uri"} = $base->{"uri"} . $uri;

    $base->{"headers"} = {
        "X-Auth-Key" => Cpanel::CloudFlare::User::get_user_api_key(),
        "X-Auth-Email" => Cpanel::CloudFlare::User::get_user_email(),
        "Content-Type" => "application/json"
    };

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

    if ($args_hr->{'port'} ne "443") {
        ## Downgrade to http
        $logger->warn("Attempted to make call on non SSL Port");
        return [{"result"=>"error", "msg" => "Plugin attempted to call CloudFlare on incorrect port: " . $args_hr->{'port'}}];
    }

    ## initialize headers and add cPanel plugin headers
    $args_hr->{"headers"} ||= {};
    $args_hr->{"headers"}->{"CF-Integration"} = 'cpanel';
    $args_hr->{"headers"}->{"CF-Integration-Version"} = Cpanel::CloudFlare::Config::get_plugin_version();
    $args_hr->{'method'} = $args_hr->{'method'} || 'POST';

    if (Cpanel::CloudFlare::Config::is_debug_mode()) {
        $logger->info("Arguments: " . Dumper($args_hr));
    }

    ## TODO: Clean this up so that the absolute url is passed, and we no longer use 'port'
    my $uri = 'https://' . $args_hr->{'host'} . $args_hr->{'uri'};
    my $request;
    if ($args_hr->{'method'} eq 'GET') {
        if ($args_hr->{'query'}) {
            foreach my $key (keys %{ $args_hr->{'query'} }) {
                $uri .= ((index($uri, '?') != -1) ? '&' : '?') . $key . '=' . $args_hr->{'query'}->{$key};
            }
        }
        $request = GET($uri, %{$args_hr->{"headers"}});
    } else {
        ## Load with the POST function of HTTP::Request::Common
        ## Then update the method to actually match what was sent

        ## LWP will encode all data as multipart/form-data even if we specify application/json
        ## so we have to manually encode it.
        my $content = $args_hr->{'query'};
        if(defined $args_hr->{"headers"}->{"Content-Type"} && $args_hr->{"headers"}->{"Content-Type"} eq "application/json") {
            $content = $json_dump_function->($content);
        }

        $request = POST($uri, %{$args_hr->{"headers"}}, Content => $content);
        $request->method($args_hr->{'method'});
    }

    if (Cpanel::CloudFlare::Config::is_debug_mode()) {
        $logger->info("Request: " . Dumper($request));
    }

    $ua = LWP::UserAgent->new;

    $response = $ua->request($request);

    if (Cpanel::CloudFlare::Config::is_debug_mode()) {
        $logger->info("Response: " . Dumper($response));
    }

    if (!$response->is_success) {
        $logger->info("Error Page: " . "{\"result\":\"error\", \"msg\":\"There was an error communicating with CloudFlare. Error header received: $response\"}");
        return "{\"result\":\"error\", \"msg\":\"There was an error communicating with CloudFlare. Error " . $response->code . " received: " . $response->message . "\"}";
    } else {
        if (Cpanel::CloudFlare::Config::is_debug_mode()) {
            $logger->info("Page: " . $response->decoded_content);
        }
        return $response->decoded_content;
    }
}

1;
