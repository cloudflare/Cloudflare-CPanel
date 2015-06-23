package Cpanel::CloudFlare::Host;

## This package is only useful when running requests as root

{
    my $file     = "/root/.cpanel/datastore/cf_api";
    my $host_api_key;

    sub load {
        my $response = "";
        $response = Cpanel::LoadFile::loadfile($file);
        $response =~ s/\n//;
        $host_api_key = $response;
    }

    sub get_host_api_key {
        if (!$host_api_key) {
            $logger->info("Missing host_api_key!");
        }

        return $host_api_key;
    }
}

1;
