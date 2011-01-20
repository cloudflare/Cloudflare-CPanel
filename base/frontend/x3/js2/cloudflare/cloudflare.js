
var VALID = [];
var CF_RECS = {};
var NUM_RECS = 0;
var REC_TEXT = [];
var WWW_DOM_INFO = [];

var signup_to_cf = function() {

    var tos = YAHOO.util.Dom.get("USER_tos").checked;
    if (!tos) {
		CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.Error, "Please agree to the Terms of Service before continuing.");
        return false;
    }

    // build the call
	var email = YAHOO.util.Dom.get("USER_email").value;
	var user = YAHOO.util.Dom.get("USER_user").value;
	var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "user_create",
        "user" : user,
        "email" : email,
	};
    
    // callback
    var callback = {
        success : function(o) {
			try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
					CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
				}
                else if (data.cpanelresult.data[0].result == 'success') {
                    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
					CPANEL.widgets.status_bar("add_USER_status_bar", "success", "Welcome to CloudFlare", "Generate a CloudFlare password <a href=\"https://www.cloudflare.com/forgot-password.html\">here</a>. Your CloudFlare email is curently set to " + email + ". Click <a href=\"\">here</a> to continue.");
                    // After 10 sec, reload the page
                    setTimeout('window.location.reload(true)', 10000);
				}
				else {
                    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = '';
					CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].msg.replace(/\\/g, ""));
				}
			}
			catch (e) {
                YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
				CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			}
        },
        failure : function(o) {
			YAHOO.util.Dom.setStyle("add_USER_record_button", "display", "block");
			YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
			CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.ajax_error, CPANEL.lang.ajax_try_again);
        }
    };
    
    // send the request
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    
    YAHOO.util.Dom.setStyle("add_USER_record_button", "display", "none");
    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = CPANEL.icons.ajax + " " + "Creating Your CloudFlare Account";
};

var reset_form = function(type) {
    VALID = [];
    CF_RECS = {};
    NUM_RECS = 0;
    REC_TEXT = [];
    WWW_DOM_INFO = [];
};

var add_validation = function() {
     
};

var handleLearnMore = function (show) {
    if (show) {
        YAHOO.util.Dom.setStyle('cf_def_show', 'display', "none"); 
        YAHOO.util.Dom.setStyle('cf_def_noshow', 'display', "block"); 
    } else {
        YAHOO.util.Dom.setStyle('cf_def_show', 'display', "block"); 
        YAHOO.util.Dom.setStyle('cf_def_noshow', 'display', "none"); 
    }
    return false;
}

var toggle_domain = function() {
	var domain = YAHOO.util.Dom.get("domain").value;
	if (domain == "_select_") {
		$("#add_record_and_zone_table").slideUp(CPANEL.JQUERY_ANIMATION_SPEED);
	}
	else {
		$("#add_record_and_zone_table").slideDown(CPANEL.JQUERY_ANIMATION_SPEED);
		update_user_records_table();
	}
	reset_form("CNAME");
};

var update_zones = function(rec_num, orig_state, old_rec, old_line) {
    var callback = {
        success : function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    update_user_records_table(function() {
                        CPANEL.widgets.status_bar("status_bar_" + rec_num, "error", 
                                                  CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                    });
                } else if (data.cpanelresult.data[0].result == "error") {
                    update_user_records_table(function() {
                        CPANEL.widgets.status_bar("status_bar_" + rec_num, "error", 
                                                  CPANEL.lang.json_error, 
                                                  data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                    });
				}
				else {
                    update_user_records_table();
			    }
			}
			catch (e) {
                update_user_records_table(function() {
                    CPANEL.widgets.status_bar("status_bar_" + rec_num, "error", 
                                              CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			    });
            }
        },
        failure : function(o) {            
            YAHOO.util.Dom.get("status_bar_" + rec_num).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };
    
    var cf_zones = [];
    for (key in CF_RECS) {
        if (CF_RECS[key]) {
            cf_zones.push(key);
        }
    }

    // send the AJAX request
    var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "zone_set",
		"zone_name" : YAHOO.util.Dom.get("domain").value,
        "user_key" : USER_ID,
        "subdomains" : cf_zones.join(","),
        "cf_recs" : YAHOO.lang.JSON.stringify(CF_RECS),
	};

    if (old_rec) {
        api2_call["old_rec"] = old_rec;
        api2_call["old_line"] = old_line;
    }

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    YAHOO.util.Dom.get("cloudflare_table_edit_" + rec_num).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
};

// Removes the given Rec from CF
var toggle_record_off = function(rec_num, old_rec, line) {
    CF_RECS[old_rec] = 0;
    update_zones(rec_num, "", old_rec, line);
};

// Adds the given Rec to CF
var toggle_record_on = function(rec_num, new_rec, line) {
    CF_RECS[new_rec] = line;
    update_zones(rec_num, "_off");
};

// Builds the Zone List.
var build_dnszone_table_markup = function(records) {
	// set the initial row stripe
	var row_toggle = 'rowA';
    var domain = YAHOO.util.Dom.get("domain").value;

	// loop through the dnszone accounts and build the table
	var html  = '<table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
        html += '<tr class="dt_header_row">';
        html += 	'<th>Type</th>';
        html += 	'<th>Name</th>';
        html += 	'<th colspan="2">Record</th>';
        html += 	'<th>CloudFlare Status</th>';
        html += '</tr>';

    // Reset these
    var is_cf_powered = false;
    NUM_RECS = records.length;
	for (var i=0; i<records.length; i++) {
         
        // A, MX, CNAME, TXT records
        if (records[i]['type'].match(/^(A|CNAME)$/)) {

            html += '<tr id="info_row_' + i + '" class="dt_info_row ' + row_toggle + '">';

            html += '<td id="name_value_' + i + '">' + records[i]['type'] + '</td>';
            html += '<td id="type_value_' + i + '">' + records[i]['name'].substring(0, records[i]['name'].length - 1) + '</td>';
            // A
            if (records[i]['type'] == 'A') {
                html += '<td colspan="2" id="value_value_hehe_' + i + '">points to ' + records[i]['address'] + '</td>';
            } 
            // CNAME
            else if (records[i]['type'] == 'CNAME') {
                html += '<td colspan="2" id="value_value_hehe_' + i + '">points to ' + records[i]['cname'] + '</td>';
            } 		

		    // action links
            html += '<td>';

            if (records[i]['cloudflare'] == 1) {                
                html +=		'<span class="action_link" id="cloudflare_table_edit_' + i
                    + '" onclick="toggle_record_off(' + i + ', \'' + records[i]['name'] + '\', '
                    + records[i]['line']+' )"><img src="https://www.cloudflare.com/images/icons-custom/solo_cloud-55x25.png" class="cf_enabled" /></span>';
                // And add the zone to our list of CF zones.
                CF_RECS[records[i]['name']] = records[i]['line'];
                REC_TEXT[i] = "CloudFlare is currently on. Click to disable";
                is_cf_powered = true;

                if (records[i]['name'].match(/^(www\.)/)) {
                    WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];                  
                }
		    } else {
                html +=		'<span class="action_link" id="cloudflare_table_edit_' + i
                    + '" onclick="toggle_record_on(' + i + ', \'' + records[i]['name'] + '\', '
                    + records[i]['line']+' )"><img src="https://www.cloudflare.com/images/icons-custom/solo_cloud_off-55x25.png" class="cf_disabled'+i+'"/></span>';
                REC_TEXT[i] = "CloudFlare is currently off. Click to enable";

                if (records[i]['name'].match(/^(www\.)/)) {
                    WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];
                }
            }
            html += '</td>';
            html += '</tr>';

            html += '<tr id="module_row_' + i + '" class="dt_module_row ' + row_toggle + '"><td colspan="7">';
            html += 	'<div id="dnszone_table_edit_div_' + i + '" class="dt_module"></div>';
            html += 	'<div id="dnszone_table_delete_div_' + i + '" class="dt_module"></div>';
		    html += 	'<div id="status_bar_' + i + '" class="cjt_status_bar"></div>';
            html += '</td></tr>';
        }

        // alternate row stripes
		row_toggle = (row_toggle == 'rowA') ? row_toggle = 'rowB' : 'rowA';
	}
	html += '</table>';

    // Set the global is CF powered text.
    if (NUM_RECS > 0) {
        if (is_cf_powered) { 
            YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "Powered by CloudFlare";
            YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = '<a href="#" onclick="return get_stats(\''+domain+'\');">[Analytics]</a>';
            YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="https://www.cloudflare.com/images/icons-custom/solo_cloud-55x25.png" onclick="toggle_all_off(\''+domain+'\') checked />';
        } else {
            YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "Not Powered by CloudFlare"; 
            YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = "&nbsp;"; 
            YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="https://www.cloudflare.com/images/icons-custom/solo_cloud_off-55x25.png" onclick="toggle_www_on(\''+domain+'\') />';
        }
    }

	return html;
};

var update_user_records_table = function(cb_lambda) {
    var callback = {
        success : function(o) {
            try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
				}
				else if (data.cpanelresult.data) {                    
                    var html = build_dnszone_table_markup(data.cpanelresult.data);
                    YAHOO.util.Dom.get("user_records_div").innerHTML = html;

                    // Now add in tool tips
	                for (var i=0; i<NUM_RECS; i++) {
                        new YAHOO.widget.Tooltip("tt_cf_enabled_"+i, { 
                            context: "cloudflare_table_edit_"+i, 
                            text: REC_TEXT[i],
                            showDelay: 300
                        });
                    }

                    // Call the cb, if it is set.
                    if (cb_lambda) {
                        cb_lambda();
                    }
				}
				else {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
			    }
			}
			catch (e) {
				CPANEL.widgets.status_bar("add_CNAME_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			}
        },
        failure : function(o) {
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };
    
    // send the AJAX request
    var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "fetchzone",
		"domain" : YAHOO.util.Dom.get("domain").value
	};
    
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
};

var push_all_off = function () {

    var callback = {
        success : function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    update_user_records_table(function() {
                        CPANEL.widgets.status_bar("status_bar_" + 0, "error", 
                                                  CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                    });
                } else if (data.cpanelresult.data[0].result == "error") {
                    update_user_records_table(function() {
                        CPANEL.widgets.status_bar("status_bar_" + 0, "error", 
                                                  CPANEL.lang.json_error, 
                                                  data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                    });
				}
				else {
                    update_user_records_table();
			    }
			}
			catch (e) {
                update_user_records_table(function() {
                    CPANEL.widgets.status_bar("status_bar_" + 0, "error", 
                                              CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
			    });
            }
        },
        failure : function(o) {            
            YAHOO.util.Dom.get("status_bar_" + 0).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };
    
    var cf_zones = [];
    for (key in CF_RECS) {
        if (CF_RECS[key]) {
            cf_zones.push(key+":"+CF_RECS[key]);
        }
    }

    // send the AJAX request
    var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "zone_delete",
		"zone_name" : YAHOO.util.Dom.get("domain").value,
        "user_key" : USER_ID,
        "subdomains" : cf_zones.join(","),
	};

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
};

var toggle_www_on = function(domain) {
    reset_form();
	YAHOO.util.Dom.get("domain").value = domain;
    var lambda = function() {
        if (WWW_DOM_INFO[2]) {
            toggle_record_on(WWW_DOM_INFO[0], WWW_DOM_INFO[1], WWW_DOM_INFO[2]);
        }
    }
    update_user_records_table(lambda);
    return false;
}

var toggle_all_off = function(domain) {
    reset_form();
	YAHOO.util.Dom.get("domain").value = domain;
    update_user_records_table(push_all_off);
    return false;
}

var enable_domain = function(domain) {
    reset_form();
	YAHOO.util.Dom.get("domain").value = domain;
    toggle_domain();
    return false;
}

var change_cf_setting = function (domain, action, value) {
    YAHOO.util.Dom.get("domain").value = domain;
    var callback = {
        success : function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error 
                        + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
                } else if (data.cpanelresult.data[0].result == "error") {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error 
                        + " " + data.cpanelresult.data[0].msg + "</div>";
			    } else {
                    get_stats(domain);
                    return false;
			    }
			}
            catch (e) {
                YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + e + "</div>";
            }
        },
        failure : function(o) {            
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error 
                + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };

    if (value == "SecurityLevelSetting") {
        value = YAHOO.util.Dom.get(value).value;
    }
    
    // send the AJAX request
    var api2_call = {
	    "cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "zone_edit_cf_setting",
		"zone_name" : YAHOO.util.Dom.get("domain").value,
        "user_email" : USER_EMAIL,
        "user_api_key" : USER_API_KEY,
        "v" : value,
        "a" : action,
	};

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    return false;
}

var get_stats = function(domain) {
    reset_form();
	YAHOO.util.Dom.get("domain").value = domain;

    var callback = {
        success : function(o) {
            try {
                var data = YAHOO.lang.JSON.parse(o.responseText);
                if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
                } else if (data.cpanelresult.data[0].result == "error") {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error 
                        + " " + data.cpanelresult.data[0].msg + "</div>";
			    } else {
                    // Display stats here.
                    var result = data.cpanelresult.data[0].response.result;
                    var stats = result.objs[0];
                    console.debug(result.timeZero);
                    var start = new Date(parseInt(result.timeZero));
                    var end = new Date(parseInt(result.timeZero) +  604800000);
                    var html = "<b>Analytics for " + YAHOO.util.Dom.get("domain").value +
                        " &middot; " + YAHOO.util.Date.format(start, {format:"%B %e, %Y"}) 
                        + " to "+ YAHOO.util.Date.format(end, {format:"%B %e, %Y"}) + "</b>";

	                html += '<table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
                    html += '<tr class="dt_header_row">';
                    html += 	'<th>&nbsp;</th>';
                    html += 	'<th>regular traffic</th>';
                    html += 	'<th>crawlers/bots</th>';
                    html += 	'<th>threats</th>';
                    html += '</tr>';

                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td>Page Views</td>';
                    html += 	'<td>'+stats.trafficBreakdown.pageviews.regular+'</t>';
                    html += 	'<td>'+stats.trafficBreakdown.pageviews.crawler+'</td>';
                    html += 	'<td>'+stats.trafficBreakdown.pageviews.threat+'</td>';
                    html += '</tr>';

                    html += '<tr class="dt_module_row rowB">';
                    html += 	'<td>Unique Visitors</td>';
                    html += 	'<td>'+stats.trafficBreakdown.uniques.regular+'</t>';
                    html += 	'<td>'+stats.trafficBreakdown.uniques.crawler+'</td>';
                    html += 	'<td>'+stats.trafficBreakdown.uniques.threat+'</td>';
                    html += '</tr>';
                    html += '</table>';

                    
                    html += '<p><table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
                    
                    var total = stats.requestsServed.cloudflare + stats.requestsServed.user;
                    var saved = stats.requestsServed.cloudflare;
                    
                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td>' + saved + ' requests saved by CloudFlare</td>';
                    html += 	'<td>' + total + ' total requests</td>';
                    html += '</tr>';

                    var total = stats.bandwidthServed.cloudflare + stats.requestsServed.user;
                    var saved = stats.bandwidthServed.cloudflare;

                    html += '<tr class="dt_module_row rowB">';
                    html += 	'<td>' + saved + 'KB bandwidth saved by CloudFlare</td>';
                    html += 	'<td>' + total + 'KB total bandwidth</td>';
                    html += '</tr>';
                    html += '</table></p>';

                    html += '<p><table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
                    
                    var security = stats.userSecuritySetting;
                    var dev_mode = stats.dev_mode * 1000;
                    var server_time = stats.currentServerTime;
			        var local_time = new Date();
			        var timeOffset = local_time.getTimezoneOffset() * 60 * 1000;                    

                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td>CloudFlare security setting: '+security+'</td>';
                    html += 	'<td><select name="SecurityLevelSetting" id="SecurityLevelSetting" onChange="change_cf_setting(\''
                        + domain+'\', \'sec_lvl\', \'' + 'SecurityLevelSetting' + '\')">';
                    html += '<option value="high"'+((security == "High")? 'selected': '')+'>High</option>'
                    html += '<option value="med"'+((security == "Medium")? 'selected': '')+'>Medium</option>'
                    html += '<option value="low"'+((security == "Low")? 'selected': '')+'>Low</option>'
                    html += '</select></td></tr>';
                    html += '<tr class="dt_module_row rowB">';
                    if (dev_mode > server_time) {
                        html += 	'<td>Development Mode will end at: ' 
                            + YAHOO.util.Date.format(new Date(dev_mode), {format: "%D %T"}) + 
                            '</td><td>Click <a href="#" onclick="change_cf_setting(\''+domain+'\', \'devmode\', 0)">here</a> to disable</td>';
                    } else {
                        html += 	'<td>Development Mode is currently off.'
                            + '</td><td>Click <a href="#" onclick="change_cf_setting(\''+domain+'\', \'devmode\', 1)">here</a> to enable</td>';
                    }
                    html += '</tr>';
                    html += '</table></p>';
                    
                    YAHOO.util.Dom.get("user_records_div").innerHTML = html;
			    }
		    }
		    catch (e) {
                YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + e + "</div>";
            }
        },
        failure : function(o) {            
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };
    
    var cf_zones = [];
    for (key in CF_RECS) {
        if (CF_RECS[key]) {
            cf_zones.push(key);
        }
    }

    // send the AJAX request
    var api2_call = {
		"cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "zone_get_stats",
		"zone_name" : YAHOO.util.Dom.get("domain").value,
        "user_email" : USER_EMAIL,
        "user_api_key" : USER_API_KEY
	};

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";

    return false;
}

var init_page = function() {

    // New signups
    var oUserSub = document.getElementById("USER_submit");
    YAHOO.util.Event.addListener(oUserSub, "click", signup_to_cf);

    // change domain
    YAHOO.util.Event.on("domain", "change", toggle_domain);
    
    add_validation();
    
    // load the table
    if (YAHOO.util.Dom.get("domain").value != "_select_") {
        update_user_records_table();
    }
};

YAHOO.util.Event.onDOMReady(init_page);

//this style rule must be independent of external style sheets
(function() {
    var _stylesheet = [
        //other rules can be added to this array
        ['div.dt_module', 'display:none']
    ];
    var inserter;
    var first_stylesheet = document.styleSheets[0];
    if ('insertRule' in first_stylesheet) { //W3C DOM
        _stylesheet.forEach( function(rule) {
            first_stylesheet.insertRule( rule[0] + ' {'+rule[1]+'}', 0 );
        } );
    }
    else { //IE
        _stylesheet.forEach( function(rule) {
            first_stylesheet.addRule( rule[0], rule[1], 0 );
        } );
    }
})();
