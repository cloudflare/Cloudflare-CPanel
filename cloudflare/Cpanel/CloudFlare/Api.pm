package Cpanel::CloudFlare::Api;

use Cpanel::Logger();

use Cpanel::CloudFlare::Config();
use Cpanel::CloudFlare::Helper();
use Cpanel::CloudFlare::Host();
use Cpanel::CloudFlare::User();

use HTTP::Request::Common;
require HTTP::Headers;
require HTTP::Request;
require LWP::UserAgent;

use strict;

my $logger = Cpanel::Logger->new();

## Helper variables
my $has_ssl;
my $json_load_function ||= Cpanel::CloudFlare::Helper::__get_json_load_function(); #json_decode
my $json_dump_function ||= Cpanel::CloudFlare::Helper::__get_json_dump_function(); #json_encode

sub client_api_request_v1 {
    my ( $query ) = @_;

    my $base = Cpanel::CloudFlare::Config::get_client_api_base();
    $base->{"query"} = $query;
    $base->{"query"}->{"tkn"} = Cpanel::CloudFlare::User::get_user_api_key();

    return cf_api_request($base);
}

sub client_api_request_v4 {
    my $method = shift;
    my $uri = shift;
    my ( $query ) = @_;

    my $base = Cpanel::CloudFlare::Config::get_client_api_base_v4();
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

    my $base = Cpanel::CloudFlare::Config::get_client_api_base();
    $base->{"uri"} = $uri;
    $base->{"query"} = $query;
    $base->{"query"}->{"tkn"} = Cpanel::CloudFlare::User::get_user_api_key();

    return cf_api_request($base);
}

sub host_api_request {
    my ( $query ) = @_;

    my $base = Cpanel::CloudFlare::Config::get_host_api_base();
    my $cf_host = Cpanel::CloudFlare::Host->new();
    $base->{"query"} = $query;

    #TODO: I thought the whole point of cfadmin was to avoid getting host key as user other than root?
    # Am I running as root right now?
    $base->{'query'}->{'host_key'} = $cf_host->get_host_api_key();
    return cf_api_request($base);
}

sub cf_api_request {
    my ( $args_hr ) = @_;

    my $result = https_post_request($args_hr);
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

    $logger->debug("Arguments: " . $json_dump_function->($args_hr));

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

    $logger->debug("Request: " . $request->as_string);

    my $ua = LWP::UserAgent->new;

    my $response = $ua->request($request);

    $logger->debug("Response: " . $response->as_string);

    # Was there a HTTP request error?
    if (!$response->is_success) {
        my $error_response = {};
        $error_response->{"result"} = "error";
        $error_response->{"msg"} = "There was an error communicating with CloudFlare. Error Code: ". $response->code ." Message: ". $response->message;

        $logger->warn("ERROR REQUEST: ". $request->as_string);
        $logger->warn("ERROR RESPONSE: ". $response->as_string);

        return $json_dump_function->($error_response);
    } else {
        my $response_content = $json_load_function->($response->{"_content"});
        #Did the API return an error?
        if(uc($response_content->{'result'}) eq uc('error')) {
            $logger->warn("ERROR ENDPOINT: ". $uri);
            $logger->warn("ERROR REQUEST: ". $request->{"_content"});
            #response content is the actual JSON response from the API
            $logger->warn("ERROR RESPONSE: ".$response->{"_content"});
        }
        return $response->decoded_content;
    }
}

1;
