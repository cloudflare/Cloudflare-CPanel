#!/bin/bash

cd /usr/local/cpanel

# Pull the host key
tmp_host_key=`cat etc/cloudflare.json | grep host_key | cut -d "\"" -f 4`
host_key=""

if [ -e /root/.cpanel/datastore/cf_api ]; then
    host_key=`cat /root/.cpanel/datastore/cf_api`
else 
    host_key=$tmp_host_key
fi

host_formal_name=`cat etc/cloudflare.json | grep host_formal_name | cut -d "\"" -f 4`
if [ "$host_key" == "" ]; then
    echo "error -- can not find a valid host key"
    exit 10
fi


installed_version=`cat etc/cloudflare.json | grep version | cut -d "\"" -f 4`
current_version=`curl -s https://api.cloudflare.com/host-gw.html -d "act=cpanel_info" -d "host_key=$host_key" | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); for (i=1; i<=n; i++) print a[i]}' | grep cpanel_latest | cut -d "\"" -f 6`
current_version_sha=`curl -s https://api.cloudflare.com/host-gw.html -d "act=cpanel_info" -d "host_key=$host_key" | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); for (i=1; i<=n; i++) print a[i]}' | grep cpanel_sha1 | cut -d "\"" -f 4`

if [[ $installed_version != $current_version ]] 
	then
		curl -s -k -L https://github.com/cloudflare/CloudFlare-CPanel/tarball/master > cloudflare.tar.gz
		download_sha=`shasum cloudflare.tar.gz | awk '{print $1}'`
		
		if [[ $download_sha == $current_version_sha ]] 
			then
			# If a new file exists, install it
			if [ ! -d cloudflare_tmp ] && [ -e "cloudflare.tar.gz" ] && [ `stat -c %u cloudflare.tar.gz` -eq 0 ]; then
			    mkdir cloudflare_tmp
			    mv cloudflare.tar.gz cloudflare_tmp/
			    cd cloudflare_tmp
			    tar -zxf cloudflare.tar.gz
			    mv */cloudflare .
			    cd cloudflare
			    ./install_cf $host_key mod_cf "${host_formal_name}"

			    # Cleanup
			    cd /usr/local/cpanel
			    rm -rf $dir
			    rm -rf cloudflare_tmp
			fi
		fi
fi
