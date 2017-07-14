#!/bin/bash
# Currently we put in $USRHOSTFLDR/cpanel/3rdparty/php/54/ folder. When upgrading PHP Version change this script to put in the correct folder.
#$1 = username
#$2 = hostname
USRHOSTFLDR="$1@$2:/usr/local"
PHPVERSION="56"

rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./proxy.live.php $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/proxy.live.php
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./index.live.php $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/index.live.php
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./stylesheets/ $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/stylesheets
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./assets/ $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/assets
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./fonts/ $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/fonts
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./compiled.js $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/compiled.js
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./compiled.js.map $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/compiled.js.map
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./config.json.sample $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/config.json.sample
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./lang/ $USRHOSTFLDR/cpanel/base/frontend/paper_lantern/cloudflare/lang
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./CloudFlare.pm $USRHOSTFLDR/cpanel/Cpanel/API/CloudFlare.pm
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./APIKey $USRHOSTFLDR/cpanel/bin/admin/CloudFlare/APIKey
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./vendor/ $USRHOSTFLDR/cpanel/3rdparty/php/$PHPVERSION/lib/php/cloudflare/vendor
rsync -avz --no-owner --no-group --no-perms --copy-dirlinks -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./src/ $USRHOSTFLDR/cpanel/3rdparty/php/$PHPVERSION/lib/php/cloudflare/src
