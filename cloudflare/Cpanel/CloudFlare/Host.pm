package Cpanel::CloudFlare::Host;

## This package is only useful when running requests as root

use strict;

{
    my $host_api_key_file = "/root/.cpanel/datastore/cf_api";
    use constant HOST_API_KEY => "host_api_key";
    my $logger = Cpanel::Logger->new();

    sub new {
        my $type = shift;

        my $self = {};
        bless $self, $type;

        $self->{&HOST_API_KEY} = "";

        my $response = Cpanel::LoadFile::loadfile($host_api_key_file);
        $response =~ s/\n//; #string replace new line with nothing

        $self->{&HOST_API_KEY} = $response;

        return $self;
    }

    sub get_host_api_key {
        my $self = shift;

        if ($self->{&HOST_API_KEY} eq "") {
            $logger->info("Missing host_api_key!");
        }

        return $self->{&HOST_API_KEY};
    }
}

1;
