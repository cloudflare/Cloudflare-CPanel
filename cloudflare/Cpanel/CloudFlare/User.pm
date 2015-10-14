package Cpanel::CloudFlare::User;

use Cpanel::CloudFlare::UserStore;

use Cpanel::CloudFlare::Logger();

use strict;

my $logger = Cpanel::CloudFlare::Logger->new();

{
    # Store the loaded user
    my $user;

    # Object loaded and stored by Cpanel::CloudFlare::UserStore
    my $user_cache;

    sub load {
        my $homedir = shift;
        $user = shift;

        if (!$homedir || !$user) {
            return 0;
        }

        my $cf_user_store = Cpanel::CloudFlare::UserStore->new("home_dir", $homedir, "user" , $user);
        $user = $cf_user_store->__load_user_api_key();

        if ($user) {
            $user_cache = $cf_user_store->__load_data_file();
        }

        return 1;
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
