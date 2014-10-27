Refer to the [cpanel readme](cloudflare/README) for specific installation requirements

## CloudFlare CPanel Quick Installation Instructions

Using an SSH client such as Terminal or Putty:

Step 1. Access cPanel for the server using root user by:

`ssh root@SERVER IP ADDRESS or SERVER NAME`

Step 2. Download necessary files and run installation

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.install.sh) $HOST_API_KEY '$YOUR_COMPANY_NAME'`

NOTE: Be sure to replace HOST_API_KEY and YOUR_COMPANY_NAME with the appropriate values

---

### Additional Installation Instructions for custom/additional themes

The CloudFlare plugin is installed into the default 'x3' theme, as well as the new 'Paper Lantern' theme if installed. If you utilize a custom theme or have alternate themes installed, the following command can be used to install the CloudFlare plugin on these themes:

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/copy2theme.sh) $BASE_THEME $ALTERNATE_THEME`

`$BASE_THEME` should be either 'x3' or 'paper_lantern', based on what theme the alternate was based on.

Replace `$ALTERNATE_THEME` with the folder name of the alternate theme on your server. This folder should be located at `/usr/local/cpanel/base/frontend/$ALTERNATE_THEME/`.
