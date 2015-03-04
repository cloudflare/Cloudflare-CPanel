Refer to the [cpanel readme](cloudflare/README) for specific installation requirements

## CloudFlare cPanel Quick Installation Instructions

Using an SSH client such as Terminal or Putty:

Step 1. Access cPanel for the server using root user by:

`ssh root@SERVER IP ADDRESS or SERVER NAME`

Step 2. Download necessary files and run installation

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.install.sh) HOST_API_KEY 'YOUR_COMPANY_NAME' [install_mode]`

NOTES:
- Be sure to replace HOST_API_KEY and YOUR_COMPANY_NAME with the appropriate values
- [install_mode] is optional and needs to be either `simple` or `extended`. Extended is the default version, adding simple to the installer shows only 1 CloudFlare icon in the main cPanel dashboard

---

### Additional Installation Instructions for custom/additional themes

The CloudFlare plugin is installed into the default 'x3' theme, as well as the new 'Paper Lantern' theme if installed. If you utilize a custom theme or have alternate themes installed, the following command can be used to install the CloudFlare plugin on these themes:

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/copy2theme.sh) BASE_THEME ALTERNATE_THEME`

`BASE_THEME` should be either 'x3' or 'paper_lantern', based on what theme the alternate was based on.

Replace `ALTERNATE_THEME` with the folder name of the alternate theme on your server. This folder should be located at `/usr/local/cpanel/base/frontend/ALTERNATE_THEME/`.

---

### Uninstalling the cPanel Plugin

An uninstall script has been provided to unregister the plugin with cPanel and remove all CloudFlare specific files from the server to deactivate the plugin.

NOTE: This will not remove zones or users from CloudFlare that have been registered through the plugin.

The following set of commands will download the necessary files, execute the uninstall script and ultimately remove the uninstall script as well:

`wget https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare/installers/cloudflare.cpanelplugin && bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare/uninstall_cf) && rm -f uninstall_cf`
