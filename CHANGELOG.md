# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [7.0.1](#7.0.1) - 2018-02-20
## Fixed
- PI-1236 Fix install issue for new users [#159](https://github.com/cloudflare/Cloudflare-CPanel/pull/159)

### Removed
- PI-528: Remove v5 install script [#157](https://github.com/cloudflare/Cloudflare-CPanel/pull/157)

## [7.0.0](#7.0.0) - 2017-07-19
## Fixed
- Fixed a bug where unicode zones were not displaying active [#148](https://github.com/cloudflare/Cloudflare-CPanel/pull/148)

### Changed
- Changed cp to overwrite files in cloudflare.install.sh  [#144](https://github.com/cloudflare/CloudFlare-CPanel/pull/144)
- Removed config.js.sample and replaced it with config.json.sample  [#150](https://github.com/cloudflare/CloudFlare-CPanel/pull/150)

### Added
- Added SSL Settings card to moresettings/security [#149](https://github.com/cloudflare/Cloudflare-CPanel/pull/149)
- Added new getConfig implementation that gets config.json.sample [#150](https://github.com/cloudflare/Cloudflare-CPanel/pull/150)
- [Frontend] Added a new splash page [#131](https://github.com/cloudflare/cloudflare-plugin-frontend/pull/131)

## [6.2.0](#6.2.0) - 2017-04-25
## Fixed
- Fixed install bug in CloudLinux [#140](https://github.com/cloudflare/Cloudflare-CPanel/pull/140)
- [Frontend] Fixed UTM codes for signup and account links [#112](https://github.com/cloudflare/CloudFlare-FrontEnd/pull/112)
- [Frontend] Fixed a bug where analytic tab selection not working properly [#113](https://github.com/cloudflare/CloudFlare-FrontEnd/pull/113)
- [Frontend] Fixed a bug where active zone selector was not clickable [#114](https://github.com/cloudflare/CloudFlare-FrontEnd/pull/114)
- [Frontend] Fixed bug where Minify was not updating [#116](https://github.com/cloudflare/CloudFlare-FrontEnd/pull/116)

### Changed
- [Frontend] Clarified the text when domain is not on Cloudflare  [#115](https://github.com/cloudflare/CloudFlare-FrontEnd/pull/115)

### Added
- [Frontend] Added help text for all cards [#118](https://github.com/cloudflare/CloudFlare-FrontEnd/pull/118)

## [6.1.5](#6.1.5) - 2017-03-15
## Fixed
- Fixed logo orientation. [#138](https://github.com/cloudflare/Cloudflare-CPanel/pull/138)
- Fix wrong values which are sent to the API [#137](https://github.com/cloudflare/Cloudflare-CPanel/pull/137)

## [6.1.4](#6.1.4) - 2017-03-8

## Fixed
- Fixed bug where the Host API login wasn't working. [#135](https://github.com/cloudflare/Cloudflare-CPanel/pull/135)
- Fixed Cloudflare logo size on cPanel homepage. [#136](https://github.com/cloudflare/Cloudflare-CPanel/pull/136)

## [6.1.3](#6.1.3) - 2017-03-6

## Added
- Partial zones will add SSL related DNS records automatically to CPanel when plugin is opened.

## Changed
- Update branding for CPanel

## [6.1.2](#6.1.2) - 2017-01-31

## Changed
- cPanel defaults to the domain page now

## Fixed
- Fixed bug which caused errors not to be propogated back to the frontend. [cd649a0854b9dc099898db6d67ab3cc3e524b4a5](https://github.com/cloudflare/Cloudflare-CPanel/commit/cd649a0854b9dc099898db6d67ab3cc3e524b4a5)

## [6.1.1](#6.1.1) - 2017-01-06

## Fixed
- [Wundark](https://github.com/Wundark) fixed install script to check for Cloudflare-Cpanel-x.x.x.tar.gz (lowercase f) which broke after the Cloudflare rebranding. [#120](https://github.com/cloudflare/Cloudflare-CPanel/pull/120)

## [6.1.0](#6.1.0) - 2016-11-08

## Changed
- Updated Logo [#113](https://github.com/cloudflare/Cloudflare-CPanel/pull/113)
- Changed CPanel UI to look more like cloudflare.com UI. [#116](https://github.com/cloudflare/Cloudflare-CPanel/pull/116)

## Fixed
- Fixed a bug where root domain was not shown in DNS Management tab. [#115](https://github.com/cloudflare/Cloudflare-CPanel/pull/115)

## [6.0.9](#6.0.9) - 2016-10-04

## Fixed
- Updated stylesheets/components.css to a fix bug which caused the options for the active zone selector to be hidden. [#112](https://github.com/cloudflare/Cloudflare-CPanel/pull/112)

## [6.0.8](#6.0.8) - 2016-09-26

## Fixed
- [cloudflare/cloudflare-frontend](https://github.com/cloudflare/Cloudflare-Frontend) upgraded to 2.5.0 to fix a bug in the SSL Card. [#111](https://github.com/cloudflare/Cloudflare-CPanel/pull/111)

## [6.0.7](#6.0.7) - 2016-09-07

## Removed
- [cloudflare/cloudflare-frontend](https://github.com/cloudflare/Cloudflare-Frontend) upgraded to 2.4.0 to remove zone scan card. [#110](https://github.com/cloudflare/Cloudflare-CPanel/pull/110)

## [6.0.6](#6.0.6) - 2016-08-25

## Fixed
- [@Kurounin](https://github.com/Kurounin) and [@uncleVALERA](https://github.com/uncleVALERA) fixed cloudflare_update.sh which broke in cPanel 58 due to a permissions issue. [#109](https://github.com/cloudflare/Cloudflare-CPanel/pull/109)
- Fixed bug in signup which caused the user not to be redirected to the plugin on successful account create. [#103](https://github.com/cloudflare/Cloudflare-CPanel/pull/103)
- Fixed bug which caused curl requests on install/update to not validate the certificate. [#106](https://github.com/cloudflare/Cloudflare-CPanel/pull/106)

## [6.0.5](#6.0.5) - 2016-07-29
## Changed
- Changed Provisioning to check if Advance Zone Editor is enabled. [#100](https://github.com/cloudflare/Cloudflare-CPanel/pull/100)

## Fixed  
- Fixed how the installer finds the php version for cPanel 58. [#101](https://github.com/cloudflare/Cloudflare-CPanel/pull/101)[#102](https://github.com/cloudflare/Cloudflare-CPanel/pull/102)


## [6.0.4](#6.0.4) - 2016-06-29
## Fixed
- Fixed bug which was causing active domains to display as inactive because the client api doesn't support pagination. [#97](https://github.com/cloudflare/Cloudflare-CPanel/pull/97)

## [6.0.3](#6.0.3) - 2016-06-08
## Changed
- PHP code for CF\API, CF\Router, and CF\Integration moved to [Cloudflare-Plugin-Backend](https://github.com/cloudflare/Cloudflare-Plugin-Backend). [#96](https://github.com/cloudflare/Cloudflare-CPanel/pull/96)
- React/Redux code now lives in [Cloudflare-Plugin-Frontend](https://github.com/cloudflare/Cloudflare-Frontend). [#91](https://github.com/cloudflare/Cloudflare-CPanel/pull/91)

### Fixed
- Fixed bug where active railguns were displaying as inactive. [#95](https://github.com/cloudflare/Cloudflare-CPanel/pull/95)

## [6.0.2](#6.0.2) - 2016-05-23
### Added
- Addon and Parked cPanel domains can now be provisioned. [#88](https://github.com/cloudflare/Cloudflare-CPanel/pull/88)

### Fixed
- Fixed typo in cloudflare_update.sh that was preventing upgrades from working.  [#90](https://github.com/cloudflare/Cloudflare-CPanel/pull/90)

## [6.0.1](#6.0.1) - 2016-05-05
### Fixed
- The cloudflare_update.sh bash script was incorrectly checking the current version number causing the update to fail. [#82](https://github.com/cloudflare/Cloudflare-CPanel/pull/82)

## [6.0.0](#6.0.0) - 2016-04-28
### Added
- Added the ability to configure the IPV6 functionality on the Performance Page
- Added the ability to configure the "Always Online" functionality on the Performance Page
- Added the ability to provision domain names with Cloudflare's "full zone" setup.
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
