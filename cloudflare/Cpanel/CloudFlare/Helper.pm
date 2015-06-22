package Cpanel::CloudFlare::Helper;


sub __serialize_request {
    my $opt_ref = shift;
    my @KEYLIST;
    foreach my $opt ( keys %$opt_ref ) {
        push @KEYLIST, Cpanel::Encoder::URI::uri_encode_str($opt) . '=' . Cpanel::Encoder::URI::uri_encode_str( $opt_ref->{$opt} );
    }
    return join( '&', @KEYLIST );
}

sub __get_json_dump_function {
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require Cpanel::JSON; };
    if ( $INC{'Cpanel/JSON.pm'} ) {
        return \&Cpanel::JSON::Dump;
    }
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require JSON::Syck; };
    if ( $INC{'JSON/Syck.pm'} ) {
        return \&JSON::Syck::Dump;
    }
    die "Failed to find JSON Dump function";
}

sub __get_json_load_function {
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require Cpanel::JSON; };
    if ( $INC{'Cpanel/JSON.pm'} ) {
        return \&Cpanel::JSON::Load;
    }
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require JSON::Syck; };
    if ( $INC{'JSON/Syck.pm'} ) {
        return \&JSON::Syck::Load;
    }
    die "Failed to find JSON load function";
}

sub __get_json_loadfile_function {
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require Cpanel::JSON; };
    if ( $INC{'Cpanel/JSON.pm'} && 'Cpanel::JSON'->can('LoadFile') ) {
        return \&Cpanel::JSON::LoadFile;
    }
    eval { local $SIG{'__DIE__'}; local $SIG{'__WARN__'}; require JSON::Syck; };
    if ( $INC{'JSON/Syck.pm'} ) {
        return \&JSON::Syck::LoadFile;
    }
    die "Failed to find JSON load function";
}

1;
