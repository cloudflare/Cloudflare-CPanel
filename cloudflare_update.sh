#!/bin/bash

#
# CloudFlare cPanel Update Script
#

FORCE_INSTALL=false
HOST_KEY=""

while getopts ":f" opt; do
    case $opt in
        f)
            FORCE_INSTALL=true
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

# Get the host key
HOST_KEY=`cat /root/.cpanel/datastore/cf_api`

# Check HOST_KEY exists
if [ "$HOST_KEY" = "" ]; then
    echo "ERROR - Missing HOST_KEY"
    exit 1
fi

# Get the version of the plugin currently installed on the server
INSTALLED_VERSION=`cat /usr/local/cpanel/base/frontend/paper_lantern/cloudflare/config.js | grep version | cut -d "\"" -f 4`

# What is the latest version of the plugin that is available
CURRENT_VERSION=`curl -s https://api.cloudflare.com/host-gw.html -d "act=cpanel_info" -d "host_key=$HOST_KEY" | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); for (i=1; i<=n; i++) print a[i]}' | grep cpanel_latest | cut -d "\"" -f 6`

# Is CURRENT_VERSION > INSTALLED_VERSION
NEW_VERSION=`echo $INSTALLED_VERSION $CURRENT_VERSION | awk '{ print ($1 < $2) ? 0 : 1 }'`

if [[ $new_version == 0 || "$FORCE_INSTALL" == true ]]
    then
        curl -s -k -L "https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.install.sh"
	    ./cloudflare.install.sh -k $HOST_KEY -n ' '
fi

