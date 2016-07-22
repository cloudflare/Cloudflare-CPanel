#!/bin/bash

#
# Uninstall script for CloudFlare cPanel plugin
#

INSTALL_DIR="/usr/local/cpanel"

# Get PHP Version
CPANELSUPPORTEDPHPPATH=`ls -al $INSTALL_DIR/3rdparty/bin/php | awk '{print $11}'`
PHPVERSION=`echo $CPANELSUPPORTEDPHPPATH | rev | cut -d '/' -f 3 | rev`

rm -rf $INSTALL_DIR/base/frontend/paper_lantern/cloudflare
rm -rf $INSTALL_DIR/bin/admin/CloudFlare
rm -rf $INSTALL_DIR/3rdparty/php/$PHPVERSION/lib/php/cloudflare

rm -rf $INSTALL_DIR/Cpanel/API/CloudFlare.pm

rm -rf /root/.cpanel/datastore/cf_api

rm -rf $INSTALL_DIR/bin/admin/CloudFlare

rm -rf $INSTALL_DIR/bin/cloudflare_update.sh

rm -f $INSTALL_DIR/base/frontend/paper_lantern/dynamicui/dynamicui_cloudflare*.conf

## Remove post update call
cfonupgrade=`grep -F "cloudflare_update" /scripts/postupcp`
if [ "$cfonupgrade" != "" ]; then
	sed -i '/cloudflare_update.sh/d' /scripts/postupcp
fi

echo "CloudFlare cPanel plugin has been uninstalled."
