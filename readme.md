Refer to the [cpanel readme](cloudflare/README) for specific installation requirements

## CloudFlare CPanel Quick Installation Instructions

Using an SSH client such as Terminal or Putty:

Step 1. Access cPanel for the server using root user by:

`ssh root@SERVER IP ADDRESS or SERVER NAME`

Step 2. Download necessary files and run installation

`bash <(curl -s https://raw.githubusercontent.com/cloudflare/CloudFlare-CPanel/master/cloudflare.install.sh) $HOST_API_KEY '$YOUR_COMPANY_NAME'`

NOTE: Be sure to replace HOST_API_KEY and YOUR_COMPANY_NAME with the appropriate values
