# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [5.3.11](#5.3.11) - 2016-01-14
### Fixed
- Cpanel 11.54 RC broke JS in some .tmpl files, those files now use CloudFlare.$ instead of $ for Jquery [#75](https://github.com/cloudflare/CloudFlare-CPanel/pull/75)
- Fixed an issue where a malicious symlink could allow changing permissions on arbitrary files. [#76](https://github.com/cloudflare/CloudFlare-CPanel/pull/76)

## [5.3.10](#5.3.10) - 2016-01-06
### Changed
- Updated error messaging when plugin detects that a zone is already active on CloudFlare [#71](https://github.com/cloudflare/CloudFlare-CPanel/pull/71)
- Plugin now supports v4 Client API. Security page now uses v4 zones/[identifier]/settings/security_level to set the the security level [#70](https://github.com/cloudflare/CloudFlare-CPanel/pull/70)

### Fixed
- Fixed a bug where activation failed when www is an A record. [#73](https://github.com/cloudflare/CloudFlare-CPanel/pull/73)
