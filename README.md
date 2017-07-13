[![Build Status](https://travis-ci.org/cloudflare/Cloudflare-CPanel.svg?branch=master)](https://travis-ci.org/cloudflare/Cloudflare-CPanel)
## Cloudflare cPanel Quick Installation Instructions

Using an SSH client such as Terminal or Putty:

Step 1. Access cPanel for the server using root user by:

`ssh root@SERVER IP ADDRESS or SERVER NAME`

Step 2. Download necessary files and run installation

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.install.sh) -k [YOUR_HOST_API_KEY] -n '[YOUR_COMPANY_NAME]' `

NOTES:
- Be sure to replace [YOUR_HOST_API_KEY] and [YOUR_COMPANY_NAME] with the appropriate values

## cPanel X3 Theme Support Deprecated
We deprecated support for the cPanel X3 theme because the theme itself is deprecated and [scheduled for removal in a future version of cPanel](https://blog.cpanel.com/its-time-to-say-goodbye-to-x3/).  We realize everyone may not be able to deprecate support for the x3 theme immedietely and have made the old v5 version of the plugin available on the `v5` branch.  This deprecated branch will not receive any updates aside from security fixes.

## Localization

The English localization will always be up to date and is located at `config/en.js`.  In the future we
plan to support more languages by default but if you would like to localize the plugin in your language
in the mean time follow these steps:

1. Copy `lang/en.js` as `lang/[LANGUAGE CODE].js` and translate it.
2. Rename `config.json.sample` to `config.json`.
3. Edit `config.json` and set `"locale": "[LANGUAGE CODE]"` using the same language code from step 1.

## Full Zone Provisioning

The plugin now supports Full Zone Provisioning but it is disabled by default.  If you would like to enable
it for your customers simple edit `config.js` so that `"featureManagerIsFullZoneProvisioningEnabled": true,`

### Uninstalling the cPanel Plugin

An uninstall script has been provided to unregister the plugin with cPanel and remove all Cloudflare specific files from the server to deactivate the plugin.

NOTE: This will not remove zones or users from Cloudflare that have been registered through the plugin.

The following set of commands will download the necessary files, execute the uninstall script and ultimately remove the uninstall script as well:

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.uninstall.sh) && rm -f cloudflare.uninstall.sh`
