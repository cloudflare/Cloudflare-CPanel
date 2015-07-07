package Cpanel::CloudFlare::Zone;

use Cpanel::CloudFlare::Api;

use Cpanel::Logger();
my $logger = Cpanel::Logger->new();

{
    # Store the loaded user
    my %zones = {};

    sub load {
        my $zone_name = shift;

        my $page = 1;
        my $per_page = 50;
        my $total_count = 0;

        while (!defined $zones->{$zone_name} && (($page-1) * $per_page) <= $total_count) {
            my $api_response = Cpanel::CloudFlare::Api::client_api_request_v4('GET', "/zones/", {
                "name" => $zone_name,
                "per_page" => $per_page,
                "page" => $page
            });

            my $results = $api_response->{"result"};

            foreach my $zone (@{$results}) {
                $zones->{$zone->{"name"}} = $zone;
            }

            $total_count = $api_response->{"result_info"}->{"total_count"};
            $page++;
        }

        if (!defined $zones->{$zone_name}) {
            return 0;
        }

        return 1;
    }

    sub get_zone_tag {
        my $zone_name = shift;

        if (!defined $zones->{$zone_name}) {
            if (!load($zone_name)) {
                return 0;
            }
        }

        return $zones->{$zone_name}->{"id"};
    }
}

1;
