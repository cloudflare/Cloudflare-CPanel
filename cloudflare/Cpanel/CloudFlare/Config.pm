package Cpanel::CloudFlare::Config;

use Cpanel::CloudFlare::Helper();

use strict;
{
    ## default host name, in case one is not set in the config
    my $DEFAULT_HOSTER_NAME = "your web hosting provider";

    ## Global cPanel plugin configuration
    my $cf_config_file = "/usr/local/cpanel/etc/cloudflare.json";

    # 11.52 Cpanel::JSON doesnt allow loadfile to be used in global scope.
    # because most of this code is procedural reading the file in every sub routine is easiest fix.

    sub get_host_api_base {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return {
            "host" => $data->{"host_name"},
            "uri" => $data->{"host_uri"},
            "port" => $data->{"host_port"}
        }
    }

    sub get_client_api_base {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return {
            "host" => $data->{"user_name"},
            "uri" => $data->{"user_uri"},
            "port" => $data->{"host_port"}
        }
    }

    sub get_client_api_base_v4 {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return {
            "host" => "api.cloudflare.com",
            "uri" => "/client/v4",
            "port" => $data->{"host_port"}
        }
    }

    sub get_host_prefix {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return $data->{"host_prefix"};
    }

    sub get_plugin_version {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return $data->{"cp_version"};
    }

    sub get_host_formal_name {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return $data->{"host_formal_name"} ? $data->{"host_formal_name"} : $DEFAULT_HOSTER_NAME;
    }

    sub get_on_cloud_message {
        my $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
        return  $data->{"cloudflare_on_message"} ? $data->{"cloudflare_on_message"} : "";
    }
}

1; #Ah, perl
