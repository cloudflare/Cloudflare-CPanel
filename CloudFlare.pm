package Cpanel::API::CloudFlare;

use strict;


#Version of perl module NOT plugin.
our $VERSION = '1.0';

# Your comments about this custom module.

# Cpanel Dependencies
use Cpanel                   ();
use Cpanel::API              ();
use Cpanel::Locale           ();
use Cpanel::Logger           ();
use Data::Dumper;

# Other dependencies go here.
# Defaults go here.
# Constants go here.

# Globals
my $logger = Cpanel::Logger->new();;

# Caches go here.

# Functions go here.

#-------------------------------------------------------------------------------------------------
# Name:
#   get_host_api_key - Gets the host API key as root
# Desc:
#   Gets the host API key as root
# Arguments:
#   n/a
# Returns:
#   $result1 - string - The host API key
#-------------------------------------------------------------------------------------------------
sub get_host_api_key {

    my ( $args, $result ) = @_;

    # https://documentation.cpanel.net/display/SDK/Guide+to+API+Privilege+Escalation+-+Application+Files
    # Makes a call to /usr/local/cpanel/bin/admin/CloudFlare/APIKey which runs as root to obtain
    # the host API key stored at /root/.cpanel/datastore/cf_api.

    my $admin_bin_call = Cpanel::Wrap::send_cpwrapd_request(
           'namespace' => 'CloudFlare',
           'module'    => 'APIKey',
           'function'  => 'get_host_api_key',
    );

    my $host_api_key = $admin_bin_call->{'data'};
    $host_api_key =~ s/\n//; #string replace new line with nothing

    if (defined $host_api_key) {
        $result->data($host_api_key);
        return 1;
    }
    else {
        $logger->warn("Failed to load Host API key.");
        return 0;
    }
}

1; #Ah, perl