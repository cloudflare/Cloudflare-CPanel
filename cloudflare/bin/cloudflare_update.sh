#!/bin/bash

cd /usr/local/cpanel

# Pull the host key
tmp_host_key=`cat etc/cloudflare.json | grep host_key | cut -d "\"" -f 4`
host_key=`/usr/local/cpanel/bin/apikeywrap $tmp_host_key`
host_formal_name=`cat etc/cloudflare.json | grep host_formal_name | cut -d "\"" -f 4`
if [ "$host_key" == "" ]; then
    echo "error -- can not find a valid host key"
    exit 10
fi

# Pull the latest version down
perl Cpanel/CloudFlare.pm check

# If a new file exists, install it
if [ -e "/tmp/cloudflare.tar.gz" ]; then
    mkdir cloudflare_tmp
    mv /tmp/cloudflare.tar.gz cloudflare_tmp/
    cd cloudflare_tmp
    tar -zxf cloudflare.tar.gz
    mv */cloudflare .
    cd cloudflare
    ./install_cf $host_key dd "${host_formal_name}"

    # Cleanup
    cd /usr/local/cpanel
    rm -rf cloudflare_tmp
fi