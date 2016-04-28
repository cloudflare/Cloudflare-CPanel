## CloudFlare cPanel Quick Installation Instructions

Using an SSH client such as Terminal or Putty:

Step 1. Access cPanel for the server using root user by:

`ssh root@SERVER IP ADDRESS or SERVER NAME`

Step 2. Download necessary files and run installation

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.install.sh) -k [YOUR HOST KEY] -n '[YOUR_COMPANY_NAME]' `

NOTES:
- Be sure to replace [HOST_API_KEY] and [YOUR_COMPANY_NAME] with the appropriate values

### Uninstalling the cPanel Plugin

An uninstall script has been provided to unregister the plugin with cPanel and remove all CloudFlare specific files from the server to deactivate the plugin.

NOTE: This will not remove zones or users from CloudFlare that have been registered through the plugin.

The following set of commands will download the necessary files, execute the uninstall script and ultimately remove the uninstall script as well:

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.uninstall.sh) && rm -f cloudflare.uninstall.sh
