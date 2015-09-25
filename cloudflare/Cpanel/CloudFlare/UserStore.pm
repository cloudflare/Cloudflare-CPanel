package Cpanel::CloudFlare::UserStore;

## HELPER METHOD FOR Cpanel::CloudFlare::User ##

use Cpanel::AdminBin();
use Cpanel::DataStore();

my $cf_data_file_name = ".cpanel/datastore/cloudflare_data.yaml";
my $cf_old_data_file_name = "/usr/local/cpanel/etc/cloudflare_data.yaml";

my $cf_data_file = "";

my $logger = Cpanel::Logger->new();
my $cf_global_data = {};

use strict;

sub new {
    my $type = shift;

    my %params = @_;

    my $self = {};
    bless $self, $type;

    for my $required (qw{ user home_dir }) {
        if(exists $params{$required}) {
            $logger->info("Required parameter '".$required."' not passed to '".$type."' constructor");
        }
    }

    # initialize all attributes by passing arguments to accessor methods.
    for my $attribute ( keys %params ) {

        if($self->can($attribute)) {
            $logger->info("Invalid parameter '".$attribute."' passed to '".$type."' constructor");
        }

        $self->$attribute( $params{$attribute} );
    }

    return $self;
}

sub __load_user_api_key {
    my $home_dir = shift;
    my $user = shift;

    my $user_lookup = Cpanel::AdminBin::adminfetchnocache( 'cf', '', 'user_lookup', 'storable', "user $user homedir $home_dir" );

    return $user_lookup->{"response"};
}

sub __load_data_file {
    my $home_dir = shift;
    my $user = shift;
    $cf_data_file = $home_dir . "/" . $cf_data_file_name;
    my $cf_global_data = {};

    __verify_file_with_user();
    if(-e $cf_data_file && Cpanel::DataStore::load_ref($cf_data_file, $cf_global_data ) ) {
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
        Cpanel::DataStore::store_ref($cf_data_file, $cf_global_data);
        chmod 0600, $cf_data_file;
    }

    return $cf_global_data;
}

sub __save_data_file {
    my ( $data ) = @_;
    Cpanel::DataStore::store_ref($cf_data_file, $data);
}

sub __verify_file_with_user{

    if ( -l $cf_data_file )
    {
        $logger->info("Symlink found. Removing cloudflare_data.yaml");
        unlink($cf_data_file);
    }

    if ( (stat($cf_data_file))[4] != $< )
    {
        if ( -e $cf_data_file)
        {
            $logger->info("Permissions incorrect on inode. Removing cloudflare_data.yaml");
            unlink($cf_data_file);
        }
        else
        {
            $logger->info("cloudflare_data.yaml does not exist.");
        }
    }
}

1;
