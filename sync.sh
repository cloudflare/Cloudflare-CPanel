#!/bin/bash
#$1 = username
#$2 = hostname
USRHOSTFLDR="$1@$2:/usr/local"
rsync -avz --no-owner --no-group --no-perms -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./cloudflare/3rdparty/ $USRHOSTFLDR/cpanel/3rdparty
#paper_lantern and x3 are symlinked to cf_base
rsync -avz --no-owner --no-group --no-perms -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./cloudflare/base/frontend/cf_base/ $USRHOSTFLDR/cloudflare_cpanel/cf_base
rsync -avz --no-owner --no-group --no-perms -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./cloudflare/bin/ $USRHOSTFLDR/cpanel/bin
rsync -avz --no-owner --no-group --no-perms -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./cloudflare/Cpanel/ $USRHOSTFLDR/cpanel/Cpanel
rsync -avz --no-owner --no-group --no-perms -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./cloudflare/etc/ $USRHOSTFLDR/cpanel/etc
rsync -avz --no-owner --no-group --no-perms -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress ./cloudflare/src/ $USRHOSTFLDR/cpanel/src/wrap
