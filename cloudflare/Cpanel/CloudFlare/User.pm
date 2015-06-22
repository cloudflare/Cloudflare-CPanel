package Cpanel::CloudFlare::User;

{
    my $homedir;
    my $user;
    my $user_api_key;

    sub load {
        $homedir = shift;
        $user = shift;

        $user_api_key = Cpanel::CloudFlare::UserStore::__load_user_api_key($homedir, $user);
    }

    sub get_user_api_key {
        if (!$user_api_key) {
            $logger->info("Missing user_api_key!");
        }

        return $user_api_key;
    }
}

1;
