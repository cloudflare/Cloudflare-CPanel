#!/bin/bash
me="$(basename "$(test -L "$0" && readlink "$0" || echo "$0")")"
host_key=$1
formal_name=$2
install_mode=$3

usage() {
    echo "Usage: ./$me HOST_KEY 'YOUR_COMPANY_NAME' [install_mode]"
    echo ""
    echo "-      If you do not have a HOST_KEY, contact CloudFlare for one before proceeding."
    echo -e "-      install_mode is optional. Set to 'simple' to have only 1 CloudFlare icon on the main cPanel dashboard.\n"
    exit 1
}

# check that we're running as root (or "effectively" as root, i.e., euid=0)
if [[ $EUID -ne 0 ]]; then
  echo "You must run this installation script as root."
  exit 1
fi

# check parameters
if [ -z "$host_key" ] || [ -z "$formal_name" ]; then
  usage
fi

echo -e "Starting CloudFlare CPanel Installation...\n"

# find the proper version to download
latest_version=$(curl -s https://api.cloudflare.com/host-gw.html -d "act=cpanel_info" -d "host_key=$host_key" | sed -e 's/[{}]/''/g' | awk -v k="text" '{n=split($0,a,","); for (i=1; i<=n; i++) print a[i]}' | grep cpanel_latest | cut -d "\"" -f 6)

if [ -z "$latest_version" ]; then
  echo -e "Error: could not find latest version. Please double check your HOST_KEY.\n"
  usage
else
  echo "Downloading and unpacking latest version v${latest_version}..." 
fi

# download and extract
download_url="https://github.com/cloudflare/CloudFlare-CPanel/archive/v5.3.11.tar.gz"
curl -skL $download_url | tar xzf -

cd "CloudFlare-CPanel-5.3.11/cloudflare"

echo "Finalizing install..."
./install_cf "$host_key" mod_cf "$formal_name" $install_mode

echo "Cleaning up"
cd "../../"
rm -rf "CloudFlare-CPanel-${latest_version}"

echo "Verify Host Name:"
cat /usr/local/cpanel/etc/cloudflare.json
