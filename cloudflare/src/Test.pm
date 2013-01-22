package Cpanel::Test;

use Cpanel::AdminBin ();

sub api2_listrootfiles {
    my %OPTS = @_;
    my $files = Cpanel::AdminBin::adminfetchnocache( 'test', '', 'LS', 'storable', $OPTS{'dir'} );

    my @RESULT;
    foreach my $file ( @{$files} ) {
        push @RESULT, { 'file' => $file };
    }
    return @RESULT;
}

sub api2_touchroot {
    my %OPTS = @_;
    my $result = Cpanel::AdminBin::adminrun( 'test', 'TOUCH', $OPTS{'dir'}, $OPTS{'file'} );
    return { 'result' => '1', 'reason' => $result };
}

sub api2 {
    my $func = shift;
    $API{'listrootfiles'}{'func'}   = 'api2_listrootfiles';
    $API{'listrootfiles'}{'engine'} = 'hasharray';
    $API{'touchroot'}{'func'}       = 'api2_touchroot';
    $API{'touchroot'}{'engine'}     = 'hasharray';
    return $API{$func};
}

1;