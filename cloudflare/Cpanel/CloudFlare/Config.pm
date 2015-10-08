package Cpanel::CloudFlare::Config;

use Cpanel::CloudFlare::Helper();
use Cpanel::Logger();

{
    ## default host name, in case one is not set in the config
    my $DEFAULT_HOSTER_NAME = "your web hosting provider";

    ## Global cPanel plugin configuration
    my $cf_config_file = "/usr/local/cpanel/etc/cloudflare.json";

    my $data;

    # Cpanel::JSON::_create_new_json_object in 11.52 does not like being called in BEGIN or CHECK
    sub INIT {
        ## stores the loaded configuration data within the static variable `$data`
        $data = Cpanel::CloudFlare::Helper::__get_json_loadfile_function()->($cf_config_file);
    }

    sub get_host_api_base {
        return {
            "host" => $data->{"host_name"},
            "uri" => $data->{"host_uri"},
            "port" => $data->{"host_port"}
        }
    }

    sub get_client_api_base {
        return {
            "host" => $data->{"user_name"},
            "uri" => $data->{"user_uri"},
            "port" => $data->{"host_port"}
        }
    }

    sub get_client_api_base_v4 {
        return {
            "host" => "api.cloudflare.com",
            "uri" => "/client/v4",
            "port" => $data->{"host_port"}
        }
    }

    sub get_host_prefix {
        return $data->{"host_prefix"};
    }

    sub get_plugin_version {
        return $data->{"cp_version"};
    }

    sub get_host_formal_name {
        return $data->{"host_formal_name"} ? $data->{"host_formal_name"} : $DEFAULT_HOSTER_NAME;
    }

    sub get_on_cloud_message {
        return  $data->{"cloudflare_on_message"} ? $data->{"cloudflare_on_message"} : "";
    }
}

1; #Ah, perl
