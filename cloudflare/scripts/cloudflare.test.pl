#!/usr/bin/perl

require Cpanel::CloudFlare;
use Data::Dumper;

{
    Cpanel::CloudFlare::CloudFlare_init();
    my $result = Cpanel::CloudFlare::api2_user_lookup();

    # simple procedural interface
    print Dumper($result);
    print Dumper($cf_host_name);
    print Dumper(Cpanel::CloudFlare::getHostName());
    my $api2 = Cpanel::CloudFlare::api2('user_create');
    my $func = $api2->{'func'};
    print Dumper($func);
    my $resp = Cpanel::CloudFlare->$func->({'email'=>'david@makethewebwork.us'});
    print Dumper($resp); # 'func', { 'key1' => 'value1', 'key2' => 'value2',}));
}

1;
