#!/usr/bin/perl

use strict;
use Test::More tests => 8 + 1;
use Test::NoWarnings;
use File::Temp;

require '../cloudflare/bin/cfadmin';

cmp_ok( bin::cfadmin::__get_current_version(), '>=', 11.30, "bin::cfadmin::__get_current_version() returns a reasonable version (>= 11.30)" );

my $serializer_function    = bin::cfadmin::__get_serializer_function();
my $json_load_function     = bin::cfadmin::__get_json_load_function();
my $json_loadfile_function = bin::cfadmin::__get_json_loadfile_function();

# Test json functions
{

    my $ref = $json_load_function->('{"pig":"cow"}');
    is_deeply( $ref, { 'pig' => 'cow' }, "json load function works as expected" );

    my ( $fh, $filename ) = File::Temp::tempfile();

    print {$fh} '{"pig":"cow"}';

    close($fh);

    my $ref2 = $json_loadfile_function->($filename);
    is_deeply( $ref2, { 'pig' => 'cow' }, "json loadfile function works as expected" );

}

# Test serializer functions
{
    no warnings 'redefine';

    local $INC{'Cpanel/AdminBin/Serializer.pm'} = '';
    local *bin::cfadmin::__get_current_version = sub {
        11.32;
    };

    my $ref = bin::cfadmin::__get_serializer_function();
    isa_ok( $ref, "CODE", "bin::cfadmin::__get_serializer_function returned a Storable object" );

    my ( $fh, $filename ) = File::Temp::tempfile();
    if ( my $pid = fork() ) {
        waitpid( $pid, 0 );
    }
    else {
        open( STDOUT, '>&=', fileno($fh) );
        $ref->( [ 'dog' => 1 ] );
        exit 0;
    }

    seek( $fh, 0, 0 );
    my $data = Storable::fd_retrieve($fh);
    is_deeply( $data, [ 'dog' => 1 ], "The Storable object works as expected" );

    local *bin::cfadmin::__get_current_version = sub {
        11.38;
    };

    my $ref_2 = bin::cfadmin::__get_serializer_function();
    isa_ok( $ref_2, "CODE", "bin::cfadmin::__get_serializer_function returned a Storable object" );
    isnt( $ref, $ref_2, "The references are different" );

    ( $fh, $filename ) = File::Temp::tempfile();
    if ( my $pid = fork() ) {
        waitpid( $pid, 0 );
    }
    else {
        open( STDOUT, '>&=', fileno($fh) );
        $ref_2->( [ 'cow' => 1 ] );
        exit 0;
    }
    seek( $fh, 0, 0 );
    my $yaml;
    {
        local $/;
        $yaml = readline($fh);
    }
    $data = Cpanel::YAML::Load($yaml);
    is_deeply( $data, [ 'cow' => 1 ], "The Cpanel::YAML object works as expected" );

}

{
    bin::cfadmin::__get_json_load_function();
}

