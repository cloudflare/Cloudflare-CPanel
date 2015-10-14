# Wrapping Cpanel::Logger to add debug logging
# Perl inheritance with super constructors is hard
# so we wrap every method, sorry.

package Cpanel::CloudFlare::Logger;

use Cpanel::Logger;
use Cpanel::CloudFlare::Config;

use strict;

my $logger;

sub new {
    my ($type, $args) = @_;
    my $self = {};
    bless $self, $type;

    $logger = Cpanel::Logger->new();

    return $self;
}

# Extending CPanel::Logger::info
sub info {
    my $self = shift;
    $logger->info(@_);
}

# Cpanel doesn't allow for debug logging as of 11.50
# Vote for it here:
# https://features.cpanel.net/topic/as-a-server-administrator-i-want-the-ability-to-set-a-debug-level-for-cpsrvd-i-can-track-errors-from-cpanel-whm
sub debug {
    my $self = shift;
    if(Cpanel::CloudFlare::Config::is_debug_mode()) {
        $logger->info(@_);
    }
}

# Cpanel::Logger->error() doesn't exist yet.
sub warn {
    my $self = shift;
    $logger->warn(@_);
}

1 #Ah, perl