import http from 'cf-util-http';

const ENDPOINT = 'https://api.cloudflare.com/client/v4';

/*
 * Indicates api call success
 *
 * @param {Object} [response]
 *
 * @returns {Boolean} Successful
 */
export function v4ResponseOk(response) {
    return (response.body.success ? true : false);
}

/*
 * Check if a zone has been activated
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneActivationCheckPutNew(zoneId, onSuccess, onError) {
    return http.put(ENDPOINT + "/zones/" + zoneId + "/activation_check", {}, onSuccess, onError);
}

/*
 * Get the analytics for a zone
 *
 * @param {String}   [zoneId]
 * @param {String}   [since]
 * @param {String}   [until]
 * @param {Boolean}  [continuous]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneAnalyticsDashboardGet({zoneId, since, until, continuous}, onSuccess, onError) {
    let opts = {
      parameters: {}
    };

    if(since) { opts.parameters.since = since; };
    if(until) { opts.parameters.until = until; };
    if(typeof continuous !== 'undefined') { opts.parameters.continuous = continuous; };

    return http.get(ENDPOINT + "/zones/" + zoneId + "/analytics/dashboard", opts, onSuccess, onError);
}

/*
 * Get all the DNS records for a zone
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneDNSRecordGetAll(zoneId, onSuccess, onError) {
    return http.get(ENDPOINT + "/zones/" + zoneId + "/dns_records", {}, onSuccess, onError);
}

/*
 * Create a new DNS record for a zone
 *
 * @param {String}   [zoneId]
 * @param {String}   [type]
 * @param {String}   [name]
 * @param {String}   [content]
 * @param {String}   [ttl]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneDNSRecordPostNew({zoneId, type, name, content, ttl}, onSuccess, onError) {
    let opts = {
        body: {
            type: type,
            name: name,
            content: content
        }
    };
    if(ttl) {opts.body.ttl = ttl};

    return http.post(ENDPOINT + "/zones/" + zoneId + "/dns_records", opts, onSuccess, onError);
}

/*
 * Edit a DNS record for a zone
 *
 * @param {String}   [zoneId]
 * @param {String}   [dnsRecordId]
 * @param {String}   [type]
 * @param {String}   [name]
 * @param {String}   [content]
 * @param {Boolean}  [proxied]
 * @param {String}   [ttl]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneDNSRecordPatch({zoneId, dnsRecordId, type, name, content, proxied, ttl}, onSuccess, onError) {
    let opts = {
      body: {}
    };

    if(type) { opts.body.type = type; }
    if(name) { opts.body.name = name; }
    if(content) { opts.body.content = content; }
    if(typeof proxied !== 'undefined') { opts.body.proxied = proxied; }
    if(ttl) { opts.body.ttl = ttl; }

    return http.patch(ENDPOINT + "/zones/" + zoneId + "/dns_records/" + dnsRecordId, opts, onSuccess, onError);
}

/*
 * Create a new zone
 *
 * @param {String}   [name]
 * @param {Boolean}  [jump_start]
 * @param {Object}   [organization]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zonePostNew({name, jump_start, organization}, onSuccess, onError) {
    let opts = {
        body: {}
    };

    opts.body.name = name;
    if(typeof jump_start !== 'undefined') { opts.body.jump_start = jump_start; }
    if(organization) { opts.body.organization = organization; }
    return http.post(ENDPOINT + "/zones", opts, onSuccess, onError);
}

/*
 * Purge the cache for a zone
 *
 * @param {String}   [zoneId]
 * @param {Object}   [files]
 * @param {Object}   [tags]
 * @param {Boolean}  [purge_everything]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zonePurgeCache({zoneId, files, tags, purge_everything}, onSuccess, onError) {
    let opts = {
        body: {}
    };

    if(typeof purge_everything !== 'undefined') {
        opts.body.purge_everything = purge_everything;
    } else {
        if(files) { opts.body.files = files; }
        if(tags) { opts.body.tags = tags; }
    }

    return http.del(ENDPOINT + "/zones/" + zoneId + "/purge_cache", opts, onSuccess, onError);

}

/*
 * Get all a customer's zones
 *
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneGetAll(onSuccess, onError) {
    return http.get(ENDPOINT + "/zones", {}, onSuccess, onError);
}

/*
 * Get settings for a zone
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneGetSettings(zoneId, onSuccess, onError) {
    return http.get(ENDPOINT + "/zones/" + zoneId + "/settings", {}, onSuccess, onError);
}

/*
 * Update a setting for a zone
 *
 * @param {String}   [settingName]
 * @param {String}   [zoneId]
 * @param {String}   [value]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zonePatchSetting(settingName, zoneId, value, onSuccess, onError) {
    let opts = {
         body: {
             value: value
         }
    };
    return http.patch(ENDPOINT + "/zones/" + zoneId + "/settings/" + settingName, opts, onSuccess, onError);
}

/*
 * Delete a customer's zone
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneDeleteZone(zoneId, onSuccess, onError) {
    return http.del(ENDPOINT + "/zones/" + zoneId, {}, onSuccess, onError);
}

/*
 * Get all available railguns for a zone
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneRailgunGetAll(zoneId, onSuccess, onError) {
    return http.get(ENDPOINT + "/zones/" + zoneId + "/railguns", {}, onSuccess, onError);
}

/*
 * Get all available railguns for a zone
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneRailgunPatch(zoneId, railgunId, connected, onSuccess, onError) {
    let opts = {
        body: {
            'connected': connected
        }
    };
    
    return http.patch(ENDPOINT + "/zones/" + zoneId + "/railguns/" + railgunId, opts, onSuccess, onError);
}

/*
 * Get CloudFlare Scan for zone
 *
 * @param {String}   [zoneId]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneScanGet(zoneId, onSuccess, onError) {
    return http.get(ENDPOINT + "/zones/" + zoneId + "/scan", {}, onSuccess, onError);
}

/*
 * Put show_interstitial CloudFlare Scan for zone
 *
 * @param {String}   [zoneId]
 * @param {Boolean}  [showInterstitial]
 * @param {Function} [onSuccess]
 * @param {Function} [onError]
 *
 * @returns {Object} API Response
 */
export function zoneScanPut(zoneId, showInterstitial, onSuccess, onError) {
    let opts = {
        body: {
            'show_interstitial': showInterstitial
        }
    };
    return http.put(ENDPOINT + "/zones/" + zoneId + "/scan", opts, onSuccess, onError);
}