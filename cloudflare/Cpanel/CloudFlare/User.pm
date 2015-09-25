package Cpanel::CloudFlare::User;

use Cpanel::CloudFlare::UserStore;

use Cpanel::Logger();
my $logger = Cpanel::Logger->new();

{
    # Store the loaded user
    my $user;

    # Object loaded and stored by Cpanel::CloudFlare::UserStore
    my $user_cache;

    sub load {
        $homedir = shift;
        $user = shift;

        if (!$homedir || !$user) {
            return 0;
        }

        $user = Cpanel::CloudFlare::UserStore::__load_user_api_key($homedir, $user);

        if ($user) {
            $user_cache = Cpanel::CloudFlare::UserStore::__load_data_file($homedir, $user);
        }

        return 1;
    }

    sub write_cache {
        Cpanel::CloudFlare::UserStore::__save_data_file($user_cache);
    }

    sub get_user_key {
        if (!$user->{"user_key"}) {
            $logger->info("Missing user_key!");
        }

        return $user->{"user_key"};
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
