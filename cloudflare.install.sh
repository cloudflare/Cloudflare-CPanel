#!/bin/bash
host_key=$1
formal_name=$2

echo "Starting CloudFlare CPanel Installation..."

echo "Downloading necessary files..."
curl -k -L https://github.com/cloudflare/CloudFlare-CPanel/tarball/master > cloudflare.tmp.tar.gz

## Load the latest commit hash and pull out the first 7 characters
sha=`curl -k -L https://api.github.com/repos/cloudflare/CloudFlare-CPanel/commits | grep -o -m1 '"sha": "[^"]*"'`
commit_hash=${sha:8:7}

echo "Unpacking files..."
tar -zxvf cloudflare.tmp.tar.gz

cd "cloudflare-CloudFlare-CPanel-${commit_hash}/cloudflare/"

echo "Finalizing install..."
./install_cf "$1" mod_cf "$2"

## Clean up files created by this install script
echo "Removing temporary files..."
cd ../../
rm -rf "cloudflare-CloudFlare-CPanel-${commit_hash}"
rm -rf "cloudflare.tmp.tar.gz"

echo "Verify Host Key & Name:"
cat /usr/local/cpanel/etc/cloudflare.json
