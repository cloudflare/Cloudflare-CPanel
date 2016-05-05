# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [6.0.1](#6.0.1) - 2016-05-05
### Fixed
- The cloudflare_update.sh bash script was incorrectly checking the current version number causing the update to fail. [#79](https://github.com/cloudflare/CloudFlare-CPanel/pull/79)

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