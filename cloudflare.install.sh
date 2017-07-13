#!/bin/bash

#
# CloudFlare cPanel Install Script
#

INSTALLER="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"

usage() {
    echo "Usage: ./$INSTALLER -k HOST_KEY -n 'ORG_NAME' [-f /path/to/local/cpanel.tar.gz ]"
    echo
    echo "     -k HOST_KEY   - Your host key. If you do not have one contact"
    echo "                     CloudFlare to obtain one before proceeding."
    echo "     -n ORG_NAME   - The name of your organization."
    echo "     -f LOCAL_FILE - By default the latest version of the cPanel plugin is"
    echo "                     downloaded from Github and installed. If the optional -f flag"
    echo "                     is given the install is done from a local file path."
    echo "                     The local file should be called CloudFlare-CPanel-1.2.3.tar.gz where 1.2.3 is"
    echo "                     the version number."
    echo "     -v            - Verbose"
    echo
    exit 1
}

# Parse the arguments
HOST_KEY=""
ORG_NAME=""
LOCAL_FILE_PATH=""
VERBOSE=false

while getopts ":k:n:f:v" opt; do
    case $opt in
        k)
            if [ "$HOST_KEY" = "" ]; then
                HOST_KEY=$OPTARG
            fi
            ;;
        n)
            if [ "$ORG_NAME" = "" ]; then
                ORG_NAME=$OPTARG
            fi
            ;;
        f)
            if [ "$LOCAL_FILE_PATH" = "" ]; then
                LOCAL_FILE_PATH=$OPTARG
            fi
            ;;
        v)
            VERBOSE=true
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
         :)
            echo "Option -$OPTARG requires an argument" >&2
            exit 1
            ;;
    esac
done

# Check for required arguments
if [ "$HOST_KEY" = "" ]; then
    echo "ERROR - Missing HOST_KEY"
    echo
    usage
    exit 1
fi

if [ "$ORG_NAME" = "" ]; then
    echo "ERROR - Missing ORG_NAME"
    echo
    usage
    exit 1
fi

if [ "$VERBOSE" = true ]; then
    echo "HOST_KEY        = '$HOST_KEY'"
    echo "ORG_NAME        = '$ORG_NAME'"
    echo "LOCAL_FILE_PATH = '$LOCAL_FILE_PATH'"
fi

# Check that we're running as root (or "effectively" as root, i.e., euid=0)
if [[ $EUID -ne 0 ]]; then
    echo "You must run this installation script as root."
    exit 1
fi

if [ "$VERBOSE" = true ]; then
    echo "Running as root"
fi

echo "Starting CloudFlare CPanel Installation..."

#
# If not installing from a local file we need to download and untar
#
if [ "$LOCAL_FILE_PATH" = "" ]; then

    # Find the proper version to download
    LATEST_VERSION=$(curl -s https://api.cloudflare.com/host-gw.html -d "act=cpanel_info" -d "host_key=$HOST_KEY" | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); for (i=1; i<=n; i++) print a[i]}' | grep cpanel_latest | cut -d "\"" -f 6)

    if [ "$VERBOSE" = true ]; then
        echo "LATEST_VERSION - '$LATEST_VERSION'"
    fi

    if [ -z "$LATEST_VERSION" ]; then
      echo -e "ERROR: Could not find latest version. Please double check your HOST_KEY.\n"
      usage
    else
      echo "Downloading and unpacking latest version v$LATEST_VERSION..."
    fi

    # Download and extract
    DOWNLOAD_URL="https://github.com/cloudflare/CloudFlare-CPanel/archive/v$LATEST_VERSION.tar.gz"

    if [ "$VERBOSE" = true ]; then
        echo "curl -sL $DOWNLOAD_URL | tar xfz -"
    fi

    curl -sL $DOWNLOAD_URL | tar xzf -

    # We could check for extract errors here, but the directory check outside
    # the if statement will take care of this

#
# We're installing from a local file
#
else

    # Check to make sure the file exists
    if [ ! -f $LOCAL_FILE_PATH ]; then
        echo "ERROR - Not found '$LOCAL_FILE_PATH'"
        exit 1
    fi

    # We expect the file to be named like so: 'Cloudflare-CPanel-$LATEST_VERSION.tar.gz'
    # for example Cloudflare-CPanel-1.2.3.tar.gz
    FNAME=$(basename "$LOCAL_FILE_PATH");
    LATEST_VERSION=$(echo -n "$FNAME" | sed 's/^Cloudflare-CPanel-//' | sed 's/.tar.gz//')

    if [ "$VERBOSE" = true ]; then
        echo "LATEST_VERSION - '$LATEST_VERSION'"
    fi

    echo "Unpacking from local tar file '$LOCAL_FILE_PATH'"
    tar xfz $LOCAL_FILE_PATH

    # We could check for extract errors here, but the directory check outside
    # the if statement will take care of this

fi

# Make sure that the tar directory got created correctly. We expect a directory
# name something like this: Cloudflare-CPanel-$LATEST_VERSION/cloudflare

if [ ! -d "Cloudflare-CPanel-$LATEST_VERSION" ]; then
    echo "ERROR - Unpack failed, directory not found: 'Cloudflare-CPanel-$LATEST_VERSION'"
    exit 1
fi

SOURCE_DIR="Cloudflare-CPanel-$LATEST_VERSION"
INSTALL_DIR="/usr/local/cpanel"

if [ "$VERBOSE" = true ]; then
    echo "Installing from '$SOURCE_DIR' to '$INSTALL_DIR'"
fi

# Create the cloudflare theme directory if it does not exist, then install files
install -d $INSTALL_DIR/base/frontend/paper_lantern/cloudflare

install $SOURCE_DIR/proxy.live.php $INSTALL_DIR/base/frontend/paper_lantern/cloudflare
install $SOURCE_DIR/index.live.php $INSTALL_DIR/base/frontend/paper_lantern/cloudflare
install $SOURCE_DIR/compiled.js $INSTALL_DIR/base/frontend/paper_lantern/cloudflare
install $SOURCE_DIR/config.json.sample $INSTALL_DIR/base/frontend/paper_lantern/cloudflare

# composer.json is used by cloudflare.update.sh to determine the current version number
install $SOURCE_DIR/composer.json $INSTALL_DIR/base/frontend/paper_lantern/cloudflare

# Install internationalization directory
install -d $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/lang
install $SOURCE_DIR/lang/* $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/lang

# Install assets directory
install -d $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/assets
install $SOURCE_DIR/assets/* $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/assets

# Install fonts directory
install -d $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/fonts
install $SOURCE_DIR/fonts/* $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/fonts

# Install stylesheets directory
install -d $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/stylesheets
install $SOURCE_DIR/stylesheets/* $INSTALL_DIR/base/frontend/paper_lantern/cloudflare/stylesheets

# Install the CloudFlare.pm file
install -d $INSTALL_DIR/Cpanel/API
install $SOURCE_DIR/CloudFlare.pm $INSTALL_DIR/Cpanel/API

# Install host key file
echo $HOST_KEY > /root/.cpanel/datastore/cf_api
chmod 600 /root/.cpanel/datastore/cf_api

# Install the API key CPanel adminbin and config
install -d $INSTALL_DIR/bin/admin/CloudFlare
install $SOURCE_DIR/APIKey $INSTALL_DIR/bin/admin/CloudFlare/APIKey
chmod 0700 $INSTALL_DIR/bin/admin/CloudFlare/APIKey
echo "mode=simple" > $INSTALL_DIR/bin/admin/CloudFlare/APIKey.conf

# Get PHP Version
CPANELSUPPORTEDPHPPATH=`ls -l $INSTALL_DIR/3rdparty/bin/php`
PHPVERSION=`echo $CPANELSUPPORTEDPHPPATH | rev | cut -d '/' -f 3 | rev`

# Install PHP code
install -d $INSTALL_DIR/3rdparty/php/$PHPVERSION/lib/php/cloudflare/vendor
/bin/cp -rf $SOURCE_DIR/vendor/* $INSTALL_DIR/3rdparty/php/$PHPVERSION/lib/php/cloudflare/vendor
install -d $INSTALL_DIR/3rdparty/php/$PHPVERSION/lib/php/cloudflare/src
/bin/cp -rf $SOURCE_DIR/src/* $INSTALL_DIR/3rdparty/php/$PHPVERSION/lib/php/cloudflare/src

# Register the plugin buttons with Cpanel
/usr/local/cpanel/scripts/install_plugin $SOURCE_DIR/installers/cloudflare_simple.tar.bz2

# Copy cloudflare_update.sh to where the cron expects it to be
install $SOURCE_DIR/cloudflare_update.sh $INSTALL_DIR/bin

# Create CPanel hook to update plugin after Cpanel Update
CF_ON_UPGRADE=`grep -F "cloudflare_update" /scripts/postupcp`
if [ "$CF_ON_UPGRADE" == "" ]; then
    echo "sh /usr/local/cpanel/bin/cloudflare_update.sh force" >> /scripts/postupcp
fi

# Create cron job to automatically update plugin
iscf=`crontab -l | grep cloudflare`
if [ "$iscf" == "" ]; then
    crontab -l > c.cur
    echo "12 2 * * 0 /usr/local/cpanel/bin/cloudflare_update.sh >/dev/null 2>&1" >> c.cur
    crontab c.cur
fi

echo "Cleaning up"
rm -rf "CloudFlare-CPanel-$LATEST_VERSION"
