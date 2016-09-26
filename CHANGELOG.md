# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [6.0.8](#6.0.8) - 2016-09-26

## Fixed
- [cloudflare/cloudflare-frontend](https://github.com/cloudflare/CloudFlare-Frontend) upgraded to 2.5.0 to fix a bug in the SSL Card. [#111](https://github.com/cloudflare/CloudFlare-CPanel/pull/111)

## [6.0.7](#6.0.7) - 2016-09-07

## Removed
- [cloudflare/cloudflare-frontend](https://github.com/cloudflare/CloudFlare-Frontend) upgraded to 2.4.0 to remove zone scan card. [#110](https://github.com/cloudflare/CloudFlare-CPanel/pull/110)

## [6.0.6](#6.0.6) - 2016-08-25

## Fixed
- [@Kurounin](https://github.com/Kurounin) and [@uncleVALERA](https://github.com/uncleVALERA) fixed cloudflare_update.sh which broke in cPanel 58 due to a permissions issue. [#109](https://github.com/cloudflare/CloudFlare-CPanel/pull/109)
- Fixed bug in signup which caused the user not to be redirected to the plugin on successful account create. [#103](https://github.com/cloudflare/CloudFlare-CPanel/pull/103)
- Fixed bug which caused curl requests on install/update to not validate the certificate. [#106](https://github.com/cloudflare/CloudFlare-CPanel/pull/106)

## [6.0.5](#6.0.5) - 2016-07-29
## Changed
- Changed Provisioning to check if Advance Zone Editor is enabled. [#100](https://github.com/cloudflare/CloudFlare-CPanel/pull/100)

## Fixed  
- Fixed how the installer finds the php version for cPanel 58. [#101](https://github.com/cloudflare/CloudFlare-CPanel/pull/101)[#102](https://github.com/cloudflare/CloudFlare-CPanel/pull/102)


## [6.0.4](#6.0.4) - 2016-06-29
## Fixed
- Fixed bug which was causing active domains to display as inactive because the client api doesn't support pagination. [#97](https://github.com/cloudflare/CloudFlare-CPanel/pull/97)

## [6.0.3](#6.0.3) - 2016-06-08
## Changed
- PHP code for CF\API, CF\Router, and CF\Integration moved to [CloudFlare-Plugin-Backend](https://github.com/cloudflare/CloudFlare-Plugin-Backend). [#96](https://github.com/cloudflare/CloudFlare-CPanel/pull/96)
- React/Redux code now lives in [CloudFlare-Plugin-Frontend](https://github.com/cloudflare/CloudFlare-Frontend). [#91](https://github.com/cloudflare/CloudFlare-CPanel/pull/91)

### Fixed
- Fixed bug where active railguns were displaying as inactive. [#95](https://github.com/cloudflare/CloudFlare-CPanel/pull/95)

## [6.0.2](#6.0.2) - 2016-05-23
### Added
- Addon and Parked cPanel domains can now be provisioned. [#88](https://github.com/cloudflare/CloudFlare-CPanel/pull/88)

### Fixed
- Fixed typo in cloudflare_update.sh that was preventing upgrades from working.  [#90](https://github.com/cloudflare/CloudFlare-CPanel/pull/90)

## [6.0.1](#6.0.1) - 2016-05-05
### Fixed
- The cloudflare_update.sh bash script was incorrectly checking the current version number causing the update to fail. [#82](https://github.com/cloudflare/CloudFlare-CPanel/pull/82)

## [6.0.0](#6.0.0) - 2016-04-28
### Added
- Added the ability to configure the IPV6 functionality on the Performance Page
- Added the ability to configure the "Always Online" functionality on the Performance Page
- Added the ability to provision domain names with CloudFlare's "full zone" setup.
- Added a button to quickly toggle "I'm Under Attack" mode.
- Added the ability to view requests, bandwidth, unique visitors, and threats blocked on the Analytics page.
- Added the ability to configure the security level setting of your website on the Security page.
- Added the ability to configure the challenge passage setting of your website on the Security page.
- Added the ability to toggle the browser integrity check setting of your website on the Security page.
- Added the ability to configure the cache level setting of your website on the Performance page.
- Added the ability to configure the auto minify setting of your website on the Performance page.
- Added the ability to toggle the development mode setting of your website on the Performance page.
- Added the ability to configure the browser cache time to live setting on the Perfromance page.
- Added the ability to purge your website's cache on the Performance page.

### Removed
- Removed the header navigation link to http://cloudflarestatus.com/.
- Removed support for the X3 theme because CPanel is deprecating it in [v11.60](https://blog.cpanel.com/its-time-to-say-goodbye-to-x3/).

### Updated
- The plugin now runs on a React/Redux front end and PHP (with one Perl module) on the backend.
- The structure of the YAML file has been changed and the data store code will automatically convert old YAML files to the new format.
