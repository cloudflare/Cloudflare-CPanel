# Wrapping Cpanel::Logger to add debug logging
# Perl inheritance with super constructors is hard
# so we wrap every method, sorry.

package Cpanel::CloudFlare::Logger;

use Cpanel::Logger;
use Cpanel::CloudFlare::Config;

use strict;

my $logger;

use constant IS_DEBUG_MODE => Cpanel::CloudFlare::Config::is_debug_mode();

## Data::Dumper is only needed within debug mode
## Some hosts do not have this installed
if (IS_DEBUG_MODE) {
    use Data::Dumper;
}

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

# Wrapping Dumper() so we dont have to worry about including it everywhere.
sub dumper {
    my $self = shift;
    if(Cpanel::CloudFlare::Config::is_debug_mode()) {
        return Dumper(@_);
    }
    return;
}

# Cpanel::Logger->error() doesn't exist yet.
sub warn {
    my $self = shift;
    $logger->warn(@_);
}

1 #Ah, perl