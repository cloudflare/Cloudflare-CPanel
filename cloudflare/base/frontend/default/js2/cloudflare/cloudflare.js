/**
* Copywrite 2011 CloudFlare, Inc.
*
* @author ian@cloudflare.com
*/

var OPEN_HELP = -1;
var VALID = [];

/*
 * Cached data describing the DNS zone table
 */
// Set of DNS entries with CF enabled
var CF_RECS = {};

// Total number of records, CNAME + A
var NUM_RECS = 0;

// Tooltips for each DNS record
var REC_TEXT = [];

// Record info for the WWW record
var WWW_DOM_INFO = [];

// Quick first stab at localization - some strings are still in the wild
var CF_LANG = {

    'creating_account' : "Creating Your CloudFlare Account. This may take several minutes.",

    'signup_welcome' : "Welcome to CloudFlare",

    'signup_info' : "Generate a CloudFlare password <a href=\"https://www.cloudflare.com/forgot-password.html\" target=\"_blank\">here</a>. Your CloudFlare email is curently set to {email}. Click <a href=\"\">here</a> to continue.",

    'tooltip_zone_cf_off' : "CloudFlare is currently off. Click to enable",

    'tooltip_zone_cf_on' : "CloudFlare is currently on. Click to disable"
};

// args is optional, only for strings which need params
var get_lang_string = function(keyname, args) {

    var translation = CF_LANG[keyname],
        args = args || {};

    if (translation) {

        try {
            return YAHOO.lang.substitute(translation, args);
        } catch (e) {}

    }
    return '';
}
var signup_to_cf = function() {

    var tos = YAHOO.util.Dom.get("USER_tos").checked,
        signup_welcome, signup_info, creating_account;
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
        "password" : YAHOO.util.Dom.get("USER_pass").value,
        "homedir" : USER_HOME_DIR
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

                    signup_welcome = get_lang_string('signup_welcome');
                    signup_info = get_lang_string('signup_info', {email: email});

                    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
                    CPANEL.widgets.status_bar("add_USER_status_bar", "success", signup_welcome, signup_info);
                    // After 10 sec, reload the page
                    setTimeout('window.location.reload(true)', 10000);
				}
				else {
                    YAHOO.util.Dom.setStyle("add_USER_record_button", "display", "block");
                    if (data.cpanelresult.data[0].err_code == 124) {
                        YAHOO.util.Dom.setStyle("cf_pass_noshow", "display", "table-row");
                        YAHOO.util.Dom.get("add_USER_record_status").innerHTML = '';
					    CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.Error, "This email is already signed up with CloudFlare. Please provide the user's CloudFlare password to continue.");
                    } else {
                        YAHOO.util.Dom.get("add_USER_record_status").innerHTML = '';
					    CPANEL.widgets.status_bar("add_USER_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                    }
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
    creating_account = get_lang_string('creating_account');
    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = CPANEL.icons.ajax + " " + creating_account;
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
    var tooltip = '', records;

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
                    update_user_records_rows([rec_num]);
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
        "homedir" : USER_HOME_DIR
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
    if (CF_ON_CLOUD_MESSAGE) {
        var timeout = 60,
            message_type = 'message',
            message_token = 'cf-toggle-on';
        $.cf.notify(CF_ON_CLOUD_MESSAGE, message_type, timeout, message_token);
    }
    CF_RECS[new_rec] = line;
    update_zones(rec_num, "_off");
};

var is_domain_cf_powered = function(records) {
    var is_cf_powered = false;
    for (var i=0, l=records.length; i<l; i++) {
        if (records[i]['type'].match(/^(CNAME)$/) &&
            records[i]['cloudflare']) {
            is_cf_powered = true;
            break;
        }
    }
    return is_cf_powered;
};

var build_dnszone_cache = function(records) {

    NUM_RECS = records.length;
    var tooltip_zone_cf_on = get_lang_string('tooltip_zone_cf_on'),
        tooltip_zone_cf_off = get_lang_string('tooltip_zone_cf_off');
    for (var i=0; i<records.length; i++) {

        // CNAME records
        if (records[i]['type'].match(/^(CNAME)$/)) {
            if (records[i]['cloudflare'] == 1) {                

                // Add the zone to our list of CF zones.
                CF_RECS[records[i]['name']] = records[i]['line'];
                REC_TEXT[i] = tooltip_zone_cf_on;

                if (records[i]['name'].match(/^(www\.)/)) {
                    WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];                  
                }
            } else {

                REC_TEXT[i] = tooltip_zone_cf_off;

                if (records[i]['name'].match(/^(www\.)/)) {
                    WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];
                }
            }
        }
    }
};

var build_dnszone_row_markup = function(type, rec_num, record) {
    var html = '';

    if (type == "CNAME") {

        html += '<td id="name_value_' + rec_num + '">' + record['type'] + '</td>';
        html += '<td id="type_value_' + rec_num + '">' + record['name'].substring(0, record['name'].length - 1) + '</td>';
        
        if (record['type'] == 'CNAME') {
            html += '<td colspan="2" id="value_value_hehe_' + rec_num + '">points to ' + record['cname'] + '</td>';
        }
    
        // action links
        html += '<td>';
    
        if (record['cloudflare'] == 1) {                
            html +=		'<span class="action_link" id="cloudflare_table_edit_' + rec_num
                + '" onclick="toggle_record_off(' + rec_num + ', \'' + record['name'] + '\', '
                + record['line']+' )"><img src="../images/cloudflare/solo_cloud-55x25.png" class="cf_enabled" /></span>';    
        } else {
            html +=		'<span class="action_link" id="cloudflare_table_edit_' + rec_num
                + '" onclick="toggle_record_on(' + rec_num + ', \'' + record['name'] + '\', '
                + record['line']+' )"><img src="../images/cloudflare/solo_cloud_off-55x25.png" class="cf_disabled'+rec_num+'"/></span>';
        }
        html += '</td>';
    }

    return html;
};

// Builds the Zone List.
var build_dnszone_table_markup = function(records) {
	// set the initial row stripe
	var row_toggle = 'rowA';
    var domain = YAHOO.util.Dom.get("domain").value;

	// loop through the dnszone accounts and build the table
	var html  = '<table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
        html += '<tr class="dt_header_row">';
        html += 	'<th>type</th>';
        html += 	'<th>name</th>';
        html += 	'<th colspan="2">record</th>';
        html += 	'<th>CloudFlare status</th>';
        html += '</tr>';


    // Setup cache data (NUM_RECS, CF_RECS, REC_TEXT, WWW_DOM_INFO)
    build_dnszone_cache(records);

	for (var i=0; i<records.length; i++) {
         
        // CNAME records
        if (records[i]['type'].match(/^(CNAME)$/)) {

            html += '<tr id="info_row_' + i + '" class="dt_info_row ' + row_toggle + '">';
            html += build_dnszone_row_markup("CNAME", i, records[i]);
            html += '</tr>';
        
            html += '<tr id="module_row_' + i + '" class="dt_module_row ' + row_toggle + '"><td colspan="7">';
            html += 	'<div id="dnszone_table_edit_div_' + i + '" class="dt_module"></div>';
            html += 	'<div id="dnszone_table_delete_div_' + i + '" class="dt_module"></div>';
            html += 	'<div id="status_bar_' + i + '" class="cjt_status_bar"></div>';
            html += '</td></tr>';

            // alternate row stripes
		    row_toggle = (row_toggle == 'rowA') ? row_toggle = 'rowB' : 'rowA';
        }
	}

	for (var i=0; i<records.length; i++) {
        // A, records
        if (records[i]['type'].match(/^(A)$/)) {

            html += '<tr id="info_row_a_' + i + '" class="dt_info_row ' + row_toggle + '">';
            html += '<td id="name_value_a_' + i + '">' + records[i]['type'] + '</td>';
            html += '<td id="type_value_a_' + i + '">' + records[i]['name'].substring(0, records[i]['name'].length - 1) + '</td>';
            
            // A
            if (records[i]['type'] == 'A') {
                html += '<td colspan="2" id="value_value_hehe_a_' + i + '">' + records[i]['address'] + '</td>';
            } 

		    // action links
            html += '<td>';
            html +=	'<a href="javascript:void(0);" onclick="show_a_help('+i+',\''+ records[i]['name'] +'\')">Want to run on CloudFlare?</a>';
            html += '</td>';
            html += '</tr>';

            html += '<tr id="module_row_a_' + i + '" class="dt_module_row ' + row_toggle + '"><td colspan="7">';
            html += '</td></tr>';

            // alternate row stripes
		    row_toggle = (row_toggle == 'rowA') ? row_toggle = 'rowB' : 'rowA';
        }
    }

	html += '</table>';

    // Set the global is CF powered text.
    if (NUM_RECS > 0) {
        if (is_domain_cf_powered(records)) { 
            YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "Powered by CloudFlare";
            YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = '<a href="javascript:void(0);" onclick="return get_stats(\''+domain+'\');">Statistics and Settings</a>';
            YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="../images/cloudflare/solo_cloud-55x25.png" onclick="toggle_all_off(\''+domain+'\')" />';
        } else {
            YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "Not Powered by CloudFlare"; 
            YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = "&nbsp;"; 
            YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="../images/cloudflare/solo_cloud_off-55x25.png" onclick="toggle_www_on(\''+domain+'\')" />';
        }
    }

	return html;
};

// Assuming the user records table is showing the table already,
// just redraw the rows given by num_rows, i.e. [1,2,3]
var update_user_records_rows = function(row_nums, cb_lambda) {
    var domain = YAHOO.util.Dom.get("domain").value;
    var callback = {
        success : function(o) {
            try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
				}
				else if (data.cpanelresult.data) {              

                    build_dnszone_cache(data.cpanelresult.data);
                    for (var i=0, l=row_nums.length; i<l; i++) {
                        var v = row_nums[i];
                        var row_html = build_dnszone_row_markup("CNAME", v, data.cpanelresult.data[v]);

                        $('#info_row_' + v).html(row_html);

                        new YAHOO.widget.Tooltip("tt_cf_enabled_"+v, { 
                            context: "cloudflare_table_edit_"+v, 
                            text: REC_TEXT[v],
                            showDelay: 300
                        });
                    }

                    // Set the global is CF powered text.
                    if (NUM_RECS > 0) {
                        if (is_domain_cf_powered(data.cpanelresult.data)) { 
                            YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "Powered by CloudFlare";
                            YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = '<a href="javascript:void(0);" onclick="return get_stats(\''+domain+'\');">Statistics and Settings</a>';
                            YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="../images/cloudflare/solo_cloud-55x25.png" onclick="toggle_all_off(\''+domain+'\')" />';
                        } else {
                            YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "Not Powered by CloudFlare"; 
                            YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = "&nbsp;"; 
                            YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="../images/cloudflare/solo_cloud_off-55x25.png" onclick="toggle_www_on(\''+domain+'\')" />';
                        }
                    }

                    // Call the cb, if it is set.
                    if (cb_lambda) {
                        cb_lambda();
                    }

                    // Scroll to the edit anchor
                    var yoffset = YAHOO.util.Dom.getY('user_records_div');
                    window.scrollTo(0, yoffset);

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
		"domain" : YAHOO.util.Dom.get("domain").value,
        "homedir" : USER_HOME_DIR
	};
    
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    for(var i=0, l=row_nums.length; i<l; i++) {
        var rec_num = row_nums[i];
        YAHOO.util.Dom.get("cloudflare_table_edit_" + rec_num).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
    }
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
                    YAHOO.util.Dom.get("user_records_div").innerHTML = 
                        '<a name="user_recs_' + YAHOO.util.Dom.get("domain").value + '"></a>' + html;

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

                    // Scroll to the edit anchor
                    var yoffset = YAHOO.util.Dom.getY('user_records_div');
                    window.scrollTo(0, yoffset);

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
		"domain" : YAHOO.util.Dom.get("domain").value,
        "homedir" : USER_HOME_DIR
	};
    
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + " [This may take several minutes]</div>";
};

// fetch zone records and build the global records cache
var refresh_records = function(cb_lambda) {
    var callback = {
        success : function(o) {
            try {
				var data = YAHOO.lang.JSON.parse(o.responseText);
				if (data.cpanelresult.error) {
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
				}
				else if (data.cpanelresult.data) {              

                    // only build the cache
                    build_dnszone_cache(data.cpanelresult.data);

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
		"domain" : YAHOO.util.Dom.get("domain").value,
        "homedir" : USER_HOME_DIR
	};
    
    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + " [This may take several minutes]</div>";
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
        "homedir" : USER_HOME_DIR
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
    refresh_records(push_all_off);
    return false;
}

var enable_domain = function(domain) {
    reset_form();
	YAHOO.util.Dom.get("domain").value = domain;
    toggle_domain();
    return false;
}

var change_cf_accnt = function() {
    window.open('https://www.cloudflare.com/cloudflare-settings.html?z='+YAHOO.util.Dom.get("domain").value,'_blank');    
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
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' 
                + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };

    if (value == "SecurityLevelSetting") {
        value = YAHOO.util.Dom.get(value).value;
    } else if (value == "AlwaysOnline") {
        value = YAHOO.util.Dom.get(value).value;
    } else if (value == "AutomaticIPv6") {
        value = YAHOO.util.Dom.get(value).value;
    } else if (value == "CachingLevel") {
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
        "homedir" : USER_HOME_DIR
	};

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    return false;
}

var hide_a_help = function(rec_num) {
    YAHOO.util.Dom.get("module_row_a_" + rec_num).innerHTML = '<td colspan="7"></td>';
    OPEN_HELP = -1;
}

var show_a_help = function(rec_num, rec_name) {

    if (OPEN_HELP >= 0) {
        YAHOO.util.Dom.get("module_row_a_" + OPEN_HELP).innerHTML = '<td colspan="7"></td>';
    }
    YAHOO.util.Dom.get("module_row_a_" + rec_num).innerHTML = '<td colspan="7"><div style="padding: 20px">A type records cannot be directly routed though the CloudFlare network. Instead, click <a href="../zoneedit/advanced.html">here</a> and either switch the type of ' + rec_name + ' to CNAME, or else make a new CNAME record pointing to ' + rec_name + '</div></td>';
    OPEN_HELP = rec_num;

    return false;
}

var showHelp = function(type) {

    var help_contents = {
        "devmode" : "CloudFlare makes your website load faster by caching static resources like images, CSS and Javascript. If you are editing cachable content (like images, CSS, or JS) and want to see the changes right away, you should enter <b>Development mode</b>. This will bypass CloudFlare's cache. Development mode will automatically toggle off after <b>3 hours</b>. Hint: Press shift-reload if you do not see your changes immediate. If you forget to enter Development mode, you should log in to your CloudFlare.com account and use Cache Purge.",
        "seclvl" : " CloudFlare provides security for your website and you can adjust your security setting for each website. A <b>low</b> security setting will challenge only the most threatening visitors. A <b>high</b> security setting will challenge all visitors that have exhibited threatening behavior within the last 14 days. We recommend starting with a high or medium setting.",
        "uniques" : "Visitors are classified by regular traffic, search engine crawlers and threats. Unique visitors is defined by unique IP addresses.",
        "visits" : "Traffic is classified by regular, search engine crawlers and threats. Page Views is defined by the number of requests to your site which return HTML.",
        "pageload" : "CloudFlare visits the home page of your website from several locations around the world from shared hosting. We do the same request twice: once through the CloudFlare system, and once directly to your site, so bypassing the CloudFlare system. We report both page load times here. CloudFlare improves the performance of your website by caching static resources like images, CSS and Javascript closer to your visitors and by compressing your requests so they are delivered quickly.",
        "hits" : "CloudFlare sits in front of your server and acts as a proxy, which means your traffic passes through our network. Our network nodes are distributed all over the world. We cache your static resources like images, CSS and Javascript at these nodes and deliver them to your visitors in those regions. By serving certain resources from these nodes, not only do we make your website load faster for your visitors, but we save you requests from your origin server. This means that CloudFlare offsets load so your server can perform optimally. CloudFlare does not cache html.",
        "bandwidth" : "Just like CloudFlare saves you requests to your origin server, CloudFlare also saves you bandwidth. By serving cached content from CloudFlare's nodes and by stopping threats before they reach your server, you will see less bandwidth usage from your origin server.",       
        "fpurge_ts":"Immediately purge all cached resources for your website. This will force CloudFlare to expire all static resources cached prior to the button click and fetch a new version.",
        "ipv46":"Automatically enable IPv6 networking for all your orange-clouded websites. CloudFlare will listen to <a href='http://en.wikipedia.org/wiki/IPv6'>IPv6</a> even if your host or server only supports IPv4.",
        "ob":"Automatically enable always online for web pages that lose connectivity or time out. Seamlessly bumps your visitors back to normal browsing when your site comes back online.",
        "cache_lvl":"Adjust your caching level to modify CloudFlare's caching behavior. The <b>basic</b> setting will cache most static resources (i.e., css, images, and JavaScript). The <b>aggressive</b> setting will cache all static resources, including ones with a query string.<br /><br />Basic: http://example.com/pic.jpg<br />Aggressive: http://example.com/pic.jpg?with=query",
        "pro":"Choose your CloudFlare plan. Upgrading will make your website even faster, even safer and even smarter. <b>SSL support</b> is included in every plan and will be <b>automatically</b> provisioned. All plans are month to month: no long-term contracts! ",
        "railgun": "Railgun is a WAN optimization technology that caches dynamic content. It speeds up the delivery of previously non-cached pages, making your site even faster."
    };

    if ('DN' in window) {

        var help_lightbox;
        if ('CF' in window && 'lightbox' in window.CF) {
            help_lightbox = window.CF.lightbox;
            help_lightbox.cfg.contentString = help_contents[type];
        } else {
            window.CF = window.CF || {};
            window.CF.lightbox = help_lightbox = new DN.Lightbox({
                contentString: help_contents[type],
                animate: false,
                maxWidth: 500
            });
        }
        help_lightbox.show.call(help_lightbox, this);
    }

    return false;
}

var set_railgun = function (domain, value) {
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
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' 
                + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };

    rtoken = YAHOO.util.Dom.get(value).value;
    
    var action = "set_railgun";
    
    if (rtoken == "remove")
         action = "remove_railgun";
    
    // send the AJAX request
    var api2_call = {
	    "cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : action,
		"zone_name" : YAHOO.util.Dom.get("domain").value,
        "user_email" : USER_EMAIL,
        "user_api_key" : USER_API_KEY,
        "rtkn" : rtoken,
        "homedir" : USER_HOME_DIR
	};

    YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    return false;
}

var set_railgun_mode = function (domain, value, mode) {
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
                    setTimeout(get_stats(domain), 3000);
                    return false;
			    }
			}
            catch (e) {
                YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + e + "</div>";
            }
        },
        failure : function(o) {            
            YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' 
                + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
        }
    };

    rtoken = YAHOO.util.Dom.get(value).value;
    
    var action = "enabled";
    
    if (YAHOO.util.Dom.get(mode).value == "0")
         action = "disabled";
        
    // send the AJAX request
    var api2_call = {
	    "cpanel_jsonapi_version" : 2,
		"cpanel_jsonapi_module" : "CloudFlare",
		"cpanel_jsonapi_func" : "set_railgun_mode",
		"zone_name" : YAHOO.util.Dom.get("domain").value,
        "user_email" : USER_EMAIL,
        "user_api_key" : USER_API_KEY,
        "rtkn" : rtoken,
        "mode" : action,
        "homedir" : USER_HOME_DIR
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

                    var activeRailgun;     
                    var activeRailgunRequest;                

                    function getActiveRailguns(domain)
                    {
 
                            var callback = {
                            success : function(o) {
                                 try {
                                    var data = YAHOO.lang.JSON.parse(o.responseText);
                                    activeRailgunRequest = o;                                    
                                    if (data.cpanelresult.error)
                                    {
                                       console.log("Hey, it didn't work.");
                                    }
                                    else if (data.cpanelresult.data[0].result == "error")
                                    {
                                       console.log("Seriously, it didn't work.");
                                    }
                                    else if (data.cpanelresult.data[0].response.railgun_conn.obj == null)
                                    {
                                       activeRailgun = null;
                                    }
                                    else
                                    {
                                       activeRailgun = data.cpanelresult.data[0].response.railgun_conn.obj;
                                    }
                                 }
                                 catch (e)
                                    {
                                       console.log("It was an exception. Happy?");
                                    }
                              },
                              failure : function (o) {
                                 console.log("It failed.");
                                 }
                              };
                              
            
                              
                            var api2_call = {
		                        "cpanel_jsonapi_version" : 2,
                        		"cpanel_jsonapi_module" : "CloudFlare",
                        		"cpanel_jsonapi_func" : "get_active_railguns",
                        		"zone_name" : YAHOO.util.Dom.get("domain").value,
                              "user_email" : USER_EMAIL,
                              "user_api_key" : USER_API_KEY,
                              "homedir" : USER_HOME_DIR
                           	};
                    
                             connection = YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');                                                          
                  } 
                  
                  getActiveRailguns(domain); 





                    // Display stats here.
                    var result = data.cpanelresult.data[0].response.result;
                    var stats = result.objs[0];

                    var numberFormat = {decimalPlaces:0, decimalSeparator:".", thousandsSeparator:","};
                    var numberFormatFloat = {decimalPlaces:2, decimalSeparator:".", thousandsSeparator:","};
                    var start = new Date(parseInt(result.timeZero));
                    var end = new Date(parseInt(result.timeEnd));
                    var html;

                    if (start > end) {
                        html = "<p><b>Basic Statistics for " + YAHOO.util.Dom.get("domain").value + "</b></p>";
                        html += "<p>Basic statistics update every 24 hours for the free service. For 15 minute statistics updates, advanced security and faster performance, upgrade to the <a href=\"https://www.cloudflare.com/pro-settings.html\" target=\"_blank\">Pro service</a>.</p>";
                    } else {
                        var start_fm = YAHOO.util.Date.format(start, {format:"%B %e, %Y"});
                        var end_fm = YAHOO.util.Date.format(end, {format:"%B %e, %Y"});
                        if (start_fm === end_fm) {
                            html = "<p><b>Basic Statistics for " + YAHOO.util.Dom.get("domain").value +
                                " &middot; " + start_fm + "</b></p>";
                        } else {
                            html = "<p><b>Basic Statistics for " + YAHOO.util.Dom.get("domain").value +
                                " &middot; " + start_fm 
                                + " to "+ end_fm + "</b></p>";
                        }
    
                    html += '<table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0">';
                    html += '<tr class="dt_header_row">';
                    html += 	'<th width="100">&nbsp;</th>';
                    html += 	'<th>regular traffic</th>';
                    html += 	'<th>crawlers/bots</th>';
                    html += 	'<th>threats</th>';
                    html += 	'<th>info</th>';
                    html += '</tr>';

                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td width="100">Page Views</td>';
                    html += 	'<td style="text-align:center;">'+YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.pageviews.regular), numberFormat)+'</td>';
                    html += 	'<td style="text-align:center;">'+YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.pageviews.crawler), numberFormat)+'</td>';
                    html += 	'<td style="text-align:center;">'+YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.pageviews.threat), numberFormat)+'</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'visits\')"></td>';
                    html += '</tr>';

                    html += '<tr class="dt_module_row rowB">';
                    html += 	'<td width="100">Unique Visitors</td>';
                    html += 	'<td style="text-align:center;">'+YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.uniques.regular), numberFormat)+'</td>';
                    html += 	'<td style="text-align:center;">'+YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.uniques.crawler), numberFormat)+'</td>';
                    html += 	'<td style="text-align:center;">'+YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.uniques.threat), numberFormat)+'</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'uniques\')"></td>';
                    html += '</tr>';
                    html += '</table>';
                    
                    html += '<p><table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
                    html += '<tr><td>';
                    
                    var total_reqs = YAHOO.util.Number.format(parseInt(stats.requestsServed.cloudflare + stats.requestsServed.user), 
                        numberFormat);
                    var saved_reqs = YAHOO.util.Number.format(parseInt(stats.requestsServed.cloudflare), numberFormat);
                    var percent_reqs = (parseInt(stats.requestsServed.cloudflare) / parseInt(stats.requestsServed.cloudflare + stats.requestsServed.user) * 100); 
                    if (isNaN(percent_reqs)) {
                        percent_reqs = 0;
                    }

                    var total_bw = parseFloat(stats.bandwidthServed.cloudflare) + parseFloat(stats.bandwidthServed.user);
                    var saved_bw = parseFloat(stats.bandwidthServed.cloudflare);
                    var percent_bw = (saved_bw / total_bw) * 100.;
                    if (isNaN(percent_bw)) {
                        percent_bw = 0;
                    }
                  
                    var total_units_bw = " KB";
                    var saved_units_bw = " KB";
                    if (total_bw >= 102.4) {
                        total_bw /= 1024.0;
                        total_units_bw = " MB";
                    }
                    if (saved_bw >= 102.4) {
                        saved_bw /= 1024.0;
                        saved_units_bw = " MB";
                    }
                    total_bw = YAHOO.util.Number.format(total_bw, numberFormatFloat);
                    saved_bw = YAHOO.util.Number.format(saved_bw, numberFormatFloat);
                    
                    var without_time = 0;
                    var cloudflare_time = 0;
                    var percent_time = 0;
 
                    if (stats.pageLoadTime) {
                        without_time = parseFloat(stats.pageLoadTime.without);
                        cloudflare_time = parseFloat(stats.pageLoadTime.cloudflare);
                        percent_time = Math.floor((1 - (cloudflare_time / without_time)) * 100) + '%';
                    }
                    html += '</tr></td>';
                    html += '</table></p>';


                    html += '<div id="analytics-stats">';

                        /**
                    if (percent_time) {
			var max_time = 1.10 * Math.max(cloudflare_time, without_time); 
			var chart_api = 'https://chart.googleapis.com/chart?cht=bvs&chco=505151|e67300&chs=200x172&chbh=90,10,10&chd=t:'+without_time+','+cloudflare_time+'&chxt=x&chxl=0:|Without%20CloudFlare|With%20CloudFlare&chds=0,5&chm=N%20*f*%20sec.,000000,0,-1,11&chds=0,'+max_time;


                    html += '<div class="analytics-speed-column" id="analytics-speed-time"> <h4 class="analytics-chartTitle"><span class="analytics-chartTitle-inner">Page Load Time <image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'pageload\')"></span></h4>';


                    html += '<table><tr><td> <span class="analytics-chart" id="analytics-speed-time-chart">  <img src="'+chart_api+'">  </span> </td></tr><tr><td><h5>CloudFlare makes your sites load about <span class="analytics-speed-info-percentFaster">'+percent_time+'</span> faster.</h5></td></tr></table></div>';
                    
                    } else {
                    html += '<div class="analytics-speed-column" id="analytics-speed-time"> <h4 class="analytics-chartTitle"><span class="analytics-chartTitle-inner">Page Load Time <image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'pageload\')"></span></h4>The page load time comparison is currently gathering data.</td></tr></table></div>';
                    }
*/

                    html += '<div class="analytics-speed-column" id="analytics-speed-request"><h4 class="analytics-chartTitle"><span class="analytics-chartTitle-inner">Requests Saved <image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'hits\')"></span></h4> <table><tr><td> <div class="analytics-chart" id="analytics-speed-requs-chart"> <img src="https://chart.googleapis.com/chart?cht=p&chco=ed7200|505151&chs=80x80&chd=t:'+percent_reqs+','+(100.0 - percent_reqs)+'" width="80" height="80"> </div> </td><td> <div class="analytics-speed-savedByCF"><span id="analytics-speed-reqs-savedByCF">'+saved_reqs+'</span> requests saved by CloudFlare</div> <div class="analytics-speed-total"><span id="analytics-speed-reqs-total">'+total_reqs+'</span> total requests</div>  </td></tr></table></div>';

                    html += '<div class="analytics-speed-column analytics-right-rail">';
                    
                    html += '<div class="analytics-speed-column" id="analytics-speed-bandwidth"><h4 class="analytics-chartTitle"><span class="analytics-chartTitle-inner">Bandwidth Saved <image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'bandwidth\')"></span></h4> <table><tr><td> <div class="analytics-chart" id="analytics-speed-bandwidth-chart"> <img src="https://chart.googleapis.com/chart?cht=p&chco=ed7200|505151&chs=80x80&chd=t:'+percent_bw+','+(100.0 - percent_bw)+'" width="80" height="80"> </div> </td><td> <div class="analytics-speed-savedByCF"><span id="analytics-speed-bandwidth-savedByCF">'+saved_bw + saved_units_bw+'</span> bandwidth saved by CloudFlare</div> <div class="analytics-speed-total"><span id="analytics-speed-bandwidth-total">'+total_bw + total_units_bw + '</span> total bandwidth</div>  </td></tr></table> </div>';
                                
                    html += '</div>';
                    html += '</div>';    
                    
                    html += '<div id="analytics-cta-row"><div id="analytics-cta" class="ctaButton"><a class="inner" href="http://www.cloudflare.com/analytics.html" target="_blank"><span class="label">See more statistics</span></a></div></div>';
                        
                    html += "<p>Note: Basic statistics update every 24 hours. For 15 minute statistics updates, advanced security and faster performance, upgrade to the <a href=\"https://www.cloudflare.com/pro-settings.html\" target=\"_blank\">Pro service</a>.</p>";

                    } // END if (end < start)

                    html += '<A NAME="infobox"></A>'
                    html += '<p id="cf-settings"><b>Cloudflare Settings for ' + YAHOO.util.Dom.get("domain").value + '</b></p>';
                    html += '<p><table id="table_dns_zone" class="dynamic_table" border="0" cellspacing="0" cellpadding="0">';
                    
                    var security    = stats.userSecuritySetting;
                    var cachelvl    = stats.cache_lvl;
                    var ip46lvl     = stats.ipv46;
                    var dev_mode    = stats.dev_mode * 1000;
                    var ob          = stats.ob;
                    var server_time = stats.currentServerTime;
			        var local_time  = new Date();
			        var timeOffset  = local_time.getTimezoneOffset() * 60 * 1000;                    

                    html += '<tr class="dt_module_row rowB">';
                    html += 	'<td width="280">CloudFlare Account Type</td>';
                    html += 	'<td><select name="AccountType" id="AccountType" onChange="change_cf_accnt()">';
                    html += '<option value="free"'+((!stats.pro_zone)? 'selected': '')+'>Free</option>'
                    html += '<option value="pro"'+((stats.pro_zone)? 'selected': '')+'>CloudFlare Pro</option>'
                    html += '</select></td><td>&nbsp;</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'pro\')"></td></tr>';
 
                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td width="280">CloudFlare security setting</td>';
                    html += 	'<td><select name="SecurityLevelSetting" id="SecurityLevelSetting" onChange="change_cf_setting(\''
                        + domain+'\', \'sec_lvl\', \'' + 'SecurityLevelSetting' + '\')">';
                    html += '<option value="high"'+((security == "High")? 'selected': '')+'>High</option>'
                    html += '<option value="med"'+((security == "Medium")? 'selected': '')+'>Medium</option>'
                    html += '<option value="low"'+((security == "Low")? 'selected': '')+'>Low</option>'
                    html += '<option value="help"'+((security == "I'm under attack!")? 'selected': '')+'>I\'m under attack!</option>'
                    html += '</select></td><td>&nbsp;</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'seclvl\')"></td></tr>';
                    html += '<tr class="dt_module_row rowB">';
                    if (dev_mode > server_time) {
                        html += 	'<td width="280">Development Mode will end at</td><td>' 
                            + YAHOO.util.Date.format(new Date(dev_mode), {format: "%D %T"}) + 
                            '</td><td>Click <a href="javascript:void(0);" onclick="change_cf_setting(\''+domain+'\', \'devmode\', 0)">here</a> to disable</td>';
                        html += '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'devmode\')"></td>';
                    } else {
                        html += 	'<td width="280">Development Mode</td><td>Off'
                            + '</td><td>Click <a href="javascript:void(0);" onclick="change_cf_setting(\''+domain+'\', \'devmode\', 1)">here</a> to enable</td>';
                        html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" onclick="showHelp(\'devmode\')"></td>';
                    }
                    html += '</tr>';
                    
                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td width="280">Cache Purge</td><td>&nbsp;'
                        + '</td><td>Click <a href="javascript:void(0);" onclick="change_cf_setting(\''+domain+'\', \'fpurge_ts\', 1)">here</a> to purge</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" class="info-icon" onclick="showHelp(\'fpurge_ts\')"></td>';
                    html += '</tr>';

                    html += '<tr class="dt_module_row rowB">';
                    html += 	'<td width="280">Always Online</td>';
                    html += 	'<td><select name="AlwaysOnline" id="AlwaysOnline" onChange="change_cf_setting(\''
                        + domain+'\', \'ob\', \'' + 'AlwaysOnline' + '\')">';
                    html += '<option value="0"'+((ob == "0")? 'selected': '')+'>Off</option>'
                    html += '<option value="1"'+((ob == "1")? 'selected': '')+'>On</option>'
                    html += '</select></td><td>&nbsp;</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" class="info-icon" onclick="showHelp(\'ob\')"></td></tr>';
                    
                    html += '<tr class="dt_module_row rowA">';
                    html += 	'<td width="280">Automatic IPv6</td>';
                    html += 	'<td><select name="AutomaticIPv6" id="AutomaticIPv6" onChange="change_cf_setting(\''
                        + domain+'\', \'ipv46\', \'' + 'AutomaticIPv6' + '\')">';
                    html += '<option value="0"'+((ip46lvl == "0")? 'selected': '')+'>Off</option>'
                    html += '<option value="3"'+((ip46lvl == "3")? 'selected': '')+'>Full</option>'
                    html += '</select></td><td>&nbsp;</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" class="info-icon" onclick="showHelp(\'ipv46\')"></td></tr>';
                    
                    html += '<tr class="dt_module_row rowB">';
                    html += 	'<td width="280">CloudFlare caching level</td>';
                    html += 	'<td><select name="CachingLevel" id="CachingLevel" onChange="change_cf_setting(\''
                        + domain+'\', \'cache_lvl\', \'' + 'CachingLevel' + '\')">';
                    html += '<option value="agg"'+((cachelvl == "agg")? 'selected': '')+'>Aggressive</option>'
                    html += '<option value="basic"'+((cachelvl == "basic")? 'selected': '')+'>Basic</option>'
                    html += '</select></td><td>&nbsp;</td>';
                    html +=     '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" class="info-icon" onclick="showHelp(\'cache_lvl\')"></td></tr>';
       
                    html += '<tr id="rglist" class="dt_module_row rowA">'; 
                    html += '</tr>'

                    html += '</table></p>';
                    html += "<p>For more statistics and settings, sign into your account at <a href=\"https://www.cloudflare.com/analytics.html\" target=\"_blank\">CloudFlare</a>.</p>";



                    YAHOO.util.Dom.get("user_records_div").innerHTML = html;

                    var railgunList;                     

                     function process_rg_response(data)
                     {
                       var rg_html="";
                       
                       if (data != null)
                       {
                           
                          railgunList = data;
                                                
                          rg_html +=     '<td width="280"><strong>Railgun</td>';
                       
                          rg_html +=     '<td><select name="Railgun" id="Railgun" onChange="set_railgun(\''+ domain+'\',' + '\'Railgun\')">';
                                                    
                          rg_html += '<option value="remove">Railgun Not Selected</option>';
                                                    
                          var suppress = false;
                          var preSelected = false;    
                                                                                           
                          for( var i = 0; i < railgunList.length; i++ )
                          {                       
                              rg_html += '<option value="' + railgunList[i].railgun_api_key + '" '; 
                              if ( (activeRailgun != null) && (activeRailgun.railgun_id == railgunList[i].railgun_id) )
                              { 
                                 rg_html += 'selected' 
                                 preSelected = true;
                              }                           
                              
                              rg_html += '>' + railgunList[i].railgun_name; 
                              
                              if (railgunList[i].railgun_mode == "0")
                                 {
                                    rg_html += ' (Disabled)';
                                    suppress = true;
                                 }   
                              
                              rg_html += '</option>';
                           }
                                                                        
                          rg_html += '</select></td>';
                          
                          if (preSelected) 
                          {
                              if(!suppress)
                              {
                                 rg_html += '<td>'
                                 rg_html += '<select name="RailgunStatus" id="RailgunStatus" onChange="set_railgun_mode(\''+ domain+'\',' + '\'Railgun\', \'RailgunStatus\')">';
                                 rg_html += '<option value="0">Off</option>'
                                 rg_html += '<option value="1"' + ( (activeRailgun.railgun_conn_mode == "1")? 'selected':'' ) + '>On</option>';
                                 rg_html += '</select></td>';
                              }
                              else
                              {
                                 rg_html += '<td>&nbsp;</td>';
                              }
                          }
                          else
                          {
                              rg_html += '<td>&nbsp;</td>'
                          }
                                                    
                          rg_html += '<td style="text-align:center;"><image src="../images/cloudflare/Info_16x16.png" width="13" height="13" class="info-icon" onclick="showHelp(\'railgun\')"></td></tr>'                     
                        
                          YAHOO.util.Dom.get("rglist").innerHTML = rg_html;
                        }
                           
                     }

                    function getRailguns(domain)
                    {
 
                            var callback = {
                            success : function(o) {
                                 try {
                                    var data = YAHOO.lang.JSON.parse(o.responseText);
                                                                        
                                    if (data.cpanelresult.error)
                                    {
                                       console.log("Hey, it didn't work.");
                                    }
                                    else if (data.cpanelresult.data[0].result == "error")
                                    {
                                       console.log("Seriously, it didn't work.");
                                    }
                                    else
                                    {
                                       process_rg_response(data.cpanelresult.data[0].response.railguns.objs);
                                    }
                                 }
                                 catch (e)
                                    {
                                       console.log("It was an exception. Happy?");
                                    }
                              },
                              failure : function (o) {
                                 console.log("It failed.");
                                 }
                              };
                              
                              
                            var api2_call = {
		                        "cpanel_jsonapi_version" : 2,
                        		"cpanel_jsonapi_module" : "CloudFlare",
                        		"cpanel_jsonapi_func" : "get_railguns",
                        		"zone_name" : YAHOO.util.Dom.get("domain").value,
                              "user_email" : USER_EMAIL,
                              "user_api_key" : USER_API_KEY,
                              "homedir" : USER_HOME_DIR
                           	};
                    
                             connection = YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');                                                          
                  } 
                  
                  
                  setTimeout(getRailguns(domain), 5000);
                
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
        "user_api_key" : USER_API_KEY,
        "homedir" : USER_HOME_DIR
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
