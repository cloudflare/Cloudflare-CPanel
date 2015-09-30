package Cpanel::CloudFlare::UserStore;

## HELPER METHOD FOR Cpanel::CloudFlare::User ##

use Cpanel::AdminBin();
use Cpanel::DataStore();

if (Cpanel::CloudFlare::Config::is_debug_mode()) {
    use Data::Dumper;
}

use strict;

my $cf_data_file_name = ".cpanel/datastore/cloudflare_data.yaml";
my $cf_old_data_file_name = "/usr/local/cpanel/etc/cloudflare_data.yaml";
# $cf_data_file set in new()
my $cf_data_file;
my $cf_global_data = {};

my $logger = Cpanel::Logger->new();

use constant CF_ZONE_TAGS_KEY => "cf_zone_tags";

sub new {
    my $type = shift;

    my %params = @_;

    my $self = {};
    bless $self, $type;

    # make sure home_dir, user args were passed
    for my $required (qw{ user home_dir }) {

        if(exists $params{$required} eq 0) {
            $logger->info("Required parameter '".$required."' not passed to '".$type."' constructor");
        }
    }

    # initialize all attributes by passing arguments to accessor methods.
    for my $attribute ( keys %params ) {

        if($self->can($attribute)) {
            $logger->info("Invalid parameter '".$attribute."' passed to '".$type."' constructor");
        }
        $self->{$attribute} = $params{$attribute};
    }

    $cf_data_file = $self->{"home_dir"} . "/". $cf_data_file_name;

    return $self;
}

sub __load_user_api_key {
    my $self = shift;
    my $home_dir = $self->{"home_dir"};
    my $user = $self->{"user"};

    my $user_lookup = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'user_lookup', 'storable', "user $user homedir $home_dir" );

    if(ref $user_lookup eq 'HASH') {
        return $user_lookup->{"response"};
    }
    return undef;
}

sub __load_data_file {
    my $self = shift;
    my $home_dir = $self->{"home_dir"};
    my $user = $self->{"user"};

    $self->__verify_file_with_user();
    if(Cpanel::DataStore::load_ref($cf_data_file, $cf_global_data)) {
        if (Cpanel::CloudFlare::Config::is_debug_mode()) {
            $logger->info("Successfully loaded cf data -- $cf_data_file");
        }
    } else {
        ## Try to load the data from the old default data file (if it exists)
        if (-e $cf_old_data_file_name) {
            $logger->info( "Failed to load cf data -- Trying to copy from $cf_old_data_file_name for $user");
            my $tmp_data = {};
            Cpanel::DataStore::load_ref($cf_old_data_file_name, $tmp_data);
            $cf_global_data->{"cf_user_tokens"}->{$user} = $tmp_data->{"cf_user_tokens"}->{$user};
            $cf_global_data->{"cf_zones"} = $tmp_data->{"cf_zones"};

        } else {
            $cf_global_data = {"cf_zones" => {}};
            $logger->info( "Failed to load cf data -- storing blank data at $cf_data_file");
        }

        Cpanel::AccessIds::do_as_user( $user, sub { Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data); } );
        chmod 0600, $cf_data_file;
    }

    return $cf_global_data;
}

sub __save_data_file {
    my $self = shift;
    my ( $data ) = @_;
    $self->__verify_file_with_user();
    Cpanel::DataStore::store_ref($cf_data_file, $data);
}

# this method is called in load and save and should never really be called outside of this file.
sub __verify_file_with_user {
    my $self = shift;
    my $user = $self->{"user"};

    $logger->info("cf_data_file: ". $cf_data_file);

    if ( -l $cf_data_file ) {
        $logger->info("Symlink found. Removing cloudflare_data.yaml.");
        unlink($cf_data_file);
    }

    # does the yaml file exist?
    if ( -e $cf_data_file ) {
        my $temp_uid = (getpwnam($user))[2];

        my $inode = (stat($cf_data_file))[4];

        $logger->info("inode: ". $inode);
        $logger->info("temp uid: ". $temp_uid);

        #Is the UID of the file not equal to the UID of the user?
        if ( $inode != (getpwnam($user))[2] ) {
            $logger->info("Permisisons incorrect on inode. Removing cloudflare_data.yaml");
            $logger->info("Expected: ".(getpwnam($user))[2]." but received: ".$inode);
            unlink($cf_data_file);
        }
    } else {
        $logger->info($cf_data_file ." does not exist.");
    }
}

1; #Ah, perl
