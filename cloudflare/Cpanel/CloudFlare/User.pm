package Cpanel::CloudFlare::User;

use Cpanel::CloudFlare::UserStore;

use Cpanel::Logger();
my $logger = Cpanel::Logger->new();

{
    my $homedir;
    my $user;
    my $user;

    sub load {
        $homedir = shift;
        $user = shift;

        $user = Cpanel::CloudFlare::UserStore::__load_user($homedir, $user);
    }

    sub get_user_api_key {
        if (!$user->{"user_api_key"}) {
            $logger->info("Missing user_api_key!");
        }

        return $user->{"user_api_key"};
    }

    sub get_user_email {
        if (!$user->{"cloudflare_email"}) {
            $logger->info("Missing cloudflare_email!");
        }

        return $user->{"cloudflare_email"};
    }
}

1;
