#!/bin/bash
base_theme=$1
alternate_theme=$2

if [[ "$base_theme" != "x3" && "$base_theme" != "paper_lantern" ]]; then
	echo "First parameter must be either 'x3' or 'paper_lantern'."
	exit 0
fi

if [[ !(-d "/usr/local/cpanel/base/frontend/${base_theme}/" ) ]]; then
	echo "Base theme directory not found."
	exit 0
fi

if [[ !(-d "/usr/local/cpanel/base/frontend/${base_theme}/cloudflare/" ) ]]; then
	echo "CloudFlare plugin is not installed for the base theme."
	exit 0
fi

if [[ !(-d "/usr/local/cpanel/base/frontend/${alternate_theme}/" ) ]]; then
	echo "Alternate theme directory not found."
	exit 0
fi

ln -sf "/usr/local/cloudflare_cpanel/${base_theme}/cloudflare" "/usr/local/cpanel/base/frontend/${alternate_theme}/cloudflare"

echo "Success: CloudFlare plugin successfully copied to ${alternate_theme}."
