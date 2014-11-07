
var CloudFlare = function() {
    return CloudFlare.init();
};

CloudFlare.fn = CloudFlare.prototype = {
};

// attach jQuery in to the cloudflare object
CloudFlare.$ = CF_jQuery;

_.extend(CloudFlare, {

    ACTIVE_DOMAIN: null,

    /* -- Start helper methods -- */

    reset_form: function() {
        this.VALID = [];
        this.CF_RECS = {};
        this.NUM_RECS = 0;
        this.REC_TEXT = [];
        this.WWW_DOM_INFO = [];
    },

    set_domain: function(domain) {
        this.ACTIVE_DOMAIN = domain;
        if (this.ACTIVE_DOMAIN == null) {
            $("#add_record_and_zone_table").slideUp(CPANEL.JQUERY_ANIMATION_SPEED);
        }
        else {
            $("#add_record_and_zone_table").slideDown(CPANEL.JQUERY_ANIMATION_SPEED);
            this.update_user_records_table();
        }
    },

    // args is optional, only for strings which need params
    // CF_LANG is loaded from cloudflare.lang.js
    get_lang_string: function(keyname, args) {

        var translation = CF_LANG[keyname],
            args = args || {};

        if (translation) {
            try {
                return YAHOO.lang.substitute(translation, args);
            } catch (e) {}
        }
        return '';
    },

    display_error: function(type, header, message) {
        var $wrapper = $('#cloudflare-error');

        if ($wrapper.length > 0) {
            html = CFT['error']({
                type: type,
                header: header,
                message: message
            });

            $wrapper.append(html).delay(8000).queue(function() { $(this).slideUp();console.log($(this)); });;
        } else {
            alert(message);
        }
    },

    ajax: function(data, callback, target, settings) {
        var data = data || {};
        var settings = settings || {};
        var callback = callback || {};

        // Add cpanel specific data
        _.extend(data, {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "cpanel_jsonapi_func" : "user_create",
            "homedir" : USER_HOME_DIR
        })
console.log(data);
        // define existing settings
        _.extend(settings, {
            url: CPANEL.urls.json_api(),
            data: data,
            success: function(resp) {
                console.log(resp);
                if (callback.success && typeof callback.success == "function") {
                    callback.success(resp);
                }
            },
            error: function(resp) {
                console.log(resp);
                if (callback.error && typeof callback.error == "function") {
                    callback.error(resp);
                }
                this.display_error("error", CPANEL.lang.Error, CPANEL.lang.ajax_try_again);
            }
        });
console.log(settings);
        $.ajax(settings);
    },

    /* -- Start action methods -- */

    signup_to_cf: function() {
        var tos = YAHOO.util.Dom.get("USER_tos").checked,
            signup_welcome, signup_info, creating_account;
        if (!tos) {
            CloudFlare.display_error("error", CPANEL.lang.Error, "Please agree to the Terms of Service before continuing.");
            return false;
        }

        // build the call
        var api2_call = {
            "user" : YAHOO.util.Dom.get("USER_user").value,
            "email" : YAHOO.util.Dom.get("USER_email").value,
            "password" : YAHOO.util.Dom.get("USER_pass").value,
        };
        
        // callback
        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    console.log(o);
                    if (data.cpanelresult.error) {
                        YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
                        CloudFlare.display_error("add_USER_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.error);
                    }
                    else if (data.cpanelresult.data[0].result == 'success') {

                        signup_welcome = this.get_lang_string('signup_welcome');
                        signup_info = this.get_lang_string('signup_info', {email: email});

                        YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
                        CloudFlare.display_error("add_USER_status_bar", "success", signup_welcome, signup_info);
                        // After 10 sec, reload the page
                        setTimeout('window.location.reload(true)', 10000);
                    }
                    else {
                        YAHOO.util.Dom.setStyle("add_USER_record_button", "display", "block");
                        if (data.cpanelresult.data[0].err_code == 124) {
                            YAHOO.util.Dom.setStyle("cf_pass_noshow", "display", "block");
                            YAHOO.util.Dom.get("add_USER_record_status").innerHTML = '';
                            CloudFlare.display_error("add_USER_status_bar", "error", CPANEL.lang.Error, "This email is already signed up with CloudFlare. Please provide the user's CloudFlare password to continue.");
                        } else {
                            YAHOO.util.Dom.get("add_USER_record_status").innerHTML = '';
                            CloudFlare.display_error("add_USER_status_bar", "error", CPANEL.lang.Error, data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                        }
                    }
                }
                catch (e) {
                    YAHOO.util.Dom.get("add_USER_record_status").innerHTML = "";
                    CloudFlare.display_error("add_USER_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                }
            },
            error : function(o) {
                $("#add_USER_record_button").show();
                $("#add_USER_record_status").html('');
            }
        };
        
        // send the request
        CloudFlare.ajax(api2_call, callback);
        
        $("#add_USER_record_button").hide();
        creating_account = CloudFlare.get_lang_string('creating_account');
        $("#add_USER_record_status").html(CPANEL.icons.ajax + " " + creating_account);
    },

    add_validation: function() {
         
    },

    handleLearnMore: function (show) {
        if (show) {
            YAHOO.util.Dom.setStyle('cf_def_show', 'display', "none"); 
            YAHOO.util.Dom.setStyle('cf_def_noshow', 'display', "block"); 
        } else {
            YAHOO.util.Dom.setStyle('cf_def_show', 'display', "block"); 
            YAHOO.util.Dom.setStyle('cf_def_noshow', 'display', "none"); 
        }
        return false;
    },

    update_zones: function(rec_num, orig_state, old_rec, old_line) {
        var tooltip = '', records;

        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data.cpanelresult.error) {
                        CloudFlare.update_user_records_table(function() {
                            CloudFlare.display_error("status_bar_" + rec_num, "error", 
                                                      CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                        });
                    } else if (data.cpanelresult.data[0].result == "error") {
                        CloudFlare.update_user_records_table(function() {
                            CloudFlare.display_error("status_bar_" + rec_num, "error", 
                                                      CPANEL.lang.json_error, 
                                                      data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                        });
                    }
                    else {
                        CloudFlare.update_user_records_rows([rec_num]);
                    }
                }
                catch (e) {
                    CloudFlare.update_user_records_table(function() {
                        CloudFlare.display_error("status_bar_" + rec_num, "error", 
                                                  CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                    });
                }
            },
            failure : function(o) {            
                YAHOO.util.Dom.get("status_bar_" + rec_num).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
            }
        };
        
        var cf_zones = [];
        for (key in this.CF_RECS) {
            if (this.CF_RECS[key]) {
                cf_zones.push(key);
            }
        }

        // send the AJAX request
        var api2_call = {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "cpanel_jsonapi_func" : "zone_set",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_key" : USER_ID,
            "subdomains" : cf_zones.join(","),
            "cf_recs" : YAHOO.lang.JSON.stringify(this.CF_RECS),
            "homedir" : USER_HOME_DIR
        };

        if (old_rec) {
            api2_call["old_rec"] = old_rec;
            api2_call["old_line"] = old_line;
        }

        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        YAHOO.util.Dom.get("cloudflare_table_edit_" + rec_num).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
    },

    // Removes the given Rec from CF
    toggle_record_off: function(rec_num, old_rec, line) {
        this.CF_RECS[old_rec] = 0;
        this.update_zones(rec_num, "", old_rec, line);
    },

    // Adds the given Rec to CF
    toggle_record_on: function(rec_num, new_rec, line) {
        if (this.CF_ON_CLOUD_MESSAGE) {
            var timeout = 60,
                message_type = 'message',
                message_token = 'cf-toggle-on';
            $.cf.notify(this.CF_ON_CLOUD_MESSAGE, message_type, timeout, message_token);
        }
        this.CF_RECS[new_rec] = line;
        this.update_zones(rec_num, "_off");
    },

    is_domain_cf_powered: function(records) {
        var is_cf_powered = false;
        for (var i=0, l=records.length; i<l; i++) {
            if (records[i]['type'].match(/^(CNAME)$/) &&
                records[i]['cloudflare']) {
                is_cf_powered = true;
                break;
            }
        }
        return is_cf_powered;
    },

    build_dnszone_cache: function(records) {

        NUM_RECS = records.length;
        var tooltip_zone_cf_on = this.get_lang_string('tooltip_zone_cf_on'),
            tooltip_zone_cf_off = this.get_lang_string('tooltip_zone_cf_off');
        for (var i=0; i<records.length; i++) {

            // CNAME records
            if (records[i]['type'].match(/^(CNAME)$/)) {
                if (records[i]['cloudflare'] == 1) {                

                    // Add the zone to our list of CF zones.
                    this.CF_RECS[records[i]['name']] = records[i]['line'];
                    this.REC_TEXT[i] = tooltip_zone_cf_on;

                    if (records[i]['name'].match(/^(www\.)/)) {
                        this.WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];                  
                    }
                } else {

                    this.REC_TEXT[i] = tooltip_zone_cf_off;

                    if (records[i]['name'].match(/^(www\.)/)) {
                        this.WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];
                    }
                }
            }
        }
    },

    build_dnszone_row_markup: function(type, rec_num, record) {
        var html = '';

        if (type == "CNAME") {

            html += '<td id="name_value_' + rec_num + '">' + record['type'] + '</td>';
            html += '<td id="type_value_' + rec_num + '">' + record['name'].substring(0, record['name'].length - 1) + '</td>';
            
            if (record['type'] == 'CNAME') {
                html += '<td colspan="2" id="value_value_hehe_' + rec_num + '"><span class="text-nonessential">points to</span> ' + record['cname'] + '</td>';
            }
        
            // action links
            html += '<td>';
        
            if (record['cloudflare'] == 1) {                
                html +=     '<span class="action_link" id="cloudflare_table_edit_' + rec_num
                    + '" onclick="CloudFlare.toggle_record_off(' + rec_num + ', \'' + record['name'] + '\', '
                    + record['line']+' )"><img src="./images/icon-cloud-on.png" class="cf_enabled" /></span>';    
            } else {
                html +=     '<span class="action_link" id="cloudflare_table_edit_' + rec_num
                    + '" onclick="CloudFlare.toggle_record_on(' + rec_num + ', \'' + record['name'] + '\', '
                    + record['line']+' )"><img src="./images/icon-cloud-bypass.png" class="cf_disabled'+rec_num+'"/></span>';
            }
            html += '</td>';
        }

        return html;
    },

    // Builds the Zone List.
    build_dnszone_table_markup: function(records) {
        var domain = this.ACTIVE_DOMAIN;

        if (records.length < 1) {
            return '';
        }

        var html = '<h4>Website Records</h4>';

        // loop through the dnszone accounts and build the table
        html += '<table id="table_dns_zone" class="table table-hover" border="0" cellspacing="0" cellpadding="0">';
        html += '<thead>';
        html += '<tr class="dt_header_row">';
        html +=     '<th>type</th>';
        html +=     '<th>name</th>';
        html +=     '<th colspan="2">record</th>';
        html +=     '<th>CloudFlare status</th>';
        html += '</tr>';
        html += '</thead>';

        // Setup cache data (NUM_RECS, CF_RECS, REC_TEXT, WWW_DOM_INFO)
        this.build_dnszone_cache(records);

        for (var i=0; i<records.length; i++) {
             
            // CNAME records
            if (records[i]['type'].match(/^(CNAME)$/)) {

                html += '<tr id="info_row_' + i + '" class="dt_info_row">';
                html += this.build_dnszone_row_markup("CNAME", i, records[i]);
                html += '</tr>';
            
                html += '<tr id="module_row_' + i + '" class="dt_module_row"><td colspan="7">';
                html +=     '<div id="dnszone_table_edit_div_' + i + '" class="dt_module"></div>';
                html +=     '<div id="dnszone_table_delete_div_' + i + '" class="dt_module"></div>';
                html +=     '<div id="status_bar_' + i + '" class="cjt_status_bar"></div>';
                html += '</td></tr>';
            }
        }

        for (var i=0; i<records.length; i++) {
            // A, records
            if (records[i]['type'].match(/^(A)$/)) {

                html += '<tr id="info_row_a_' + i + '" class="dt_info_row">';
                html += '<td id="name_value_a_' + i + '">' + records[i]['type'] + '</td>';
                html += '<td id="type_value_a_' + i + '">' + records[i]['name'].substring(0, records[i]['name'].length - 1) + '</td>';
                
                // A
                if (records[i]['type'] == 'A') {
                    html += '<td colspan="2" id="value_value_hehe_a_' + i + '">' + records[i]['address'] + '</td>';
                } 

                // action links
                html += '<td>';
                html += '<a href="javascript:void(0);" class="btn" onclick="show_a_help('+i+',\''+ records[i]['name'] +'\')">Run on CloudFlare</a>';
                html += '</td>';
                html += '</tr>';

                html += '<tr id="module_row_a_' + i + '" class="dt_module_row"><td colspan="7">';
                html += '</td></tr>';
            }
        }

        html += '</table>';

        // Set the global is CF powered text.
        if (this.NUM_RECS > 0) {
            if (this.is_domain_cf_powered(records)) { 
                YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "<span class=\"label label-success\">Powered by CloudFlare</span>";
                YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = '<a href="javascript:void(0);" class="btn btn-info" onclick="return CloudFlare.get_stats(\''+domain+'\');">Statistics and Settings</a>';
                YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="./images/icon-cloud-on.png" onclick="CloudFlare.toggle_all_off(\''+domain+'\')" />';
            } else {
                YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "<span class=\"label\">Not Powered by CloudFlare</span>"; 
                YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = "&nbsp;"; 
                YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="./images/icon-cloud-bypass.png" onclick="CloudFlare.toggle_www_on(\''+domain+'\')" />';
            }
        }

        return html;
    },

    // Assuming the user records table is showing the table already,
    // just redraw the rows given by num_rows, i.e. [1,2,3]
    update_user_records_rows: function(row_nums, cb_lambda) {
        var domain = this.ACTIVE_DOMAIN;
        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data.cpanelresult.error) {
                        YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
                    }
                    else if (data.cpanelresult.data) {              

                        CloudFlare.build_dnszone_cache(data.cpanelresult.data);
                        for (var i=0, l=row_nums.length; i<l; i++) {
                            var v = row_nums[i];
                            var row_html = CloudFlare.build_dnszone_row_markup("CNAME", v, data.cpanelresult.data[v]);

                            $('#info_row_' + v).html(row_html);

                            new YAHOO.widget.Tooltip("tt_cf_enabled_"+v, { 
                                context: "cloudflare_table_edit_"+v, 
                                text: REC_TEXT[v],
                                showDelay: 300
                            });
                        }

                        // Set the global is CF powered text.
                        if (CloudFlare.NUM_RECS > 0) {
                            if (CloudFlare.is_domain_cf_powered(data.cpanelresult.data)) { 
                                YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "<span class=\"label label-success\">Powered by CloudFlare</span>";
                                YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = '<a href="javascript:void(0);" class="btn btn-info" onclick="return CloudFlare.get_stats(\''+domain+'\');">Statistics and Settings</a>';
                                YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="./images/icon-cloud-on.png" onclick="CloudFlare.toggle_all_off(\''+domain+'\')" />';
                            } else {
                                YAHOO.util.Dom.get("cf_powered_" + domain).innerHTML = "<span class=\"label\">Not Powered by CloudFlare</span>"; 
                                YAHOO.util.Dom.get("cf_powered_stats" + domain).innerHTML = "&nbsp;"; 
                                YAHOO.util.Dom.get("cf_powered_check" + domain).innerHTML = '<img src="./images/icon-cloud-bypass.png" onclick="CloudFlare.toggle_www_on(\''+domain+'\')" />';
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
                    CloudFlare.display_error("add_CNAME_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
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
            "domain" : this.ACTIVE_DOMAIN,
            "homedir" : USER_HOME_DIR
        };
        
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        for(var i=0, l=row_nums.length; i<l; i++) {
            var rec_num = row_nums[i];
            YAHOO.util.Dom.get("cloudflare_table_edit_" + rec_num).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";
        }
    },


    update_user_records_table: function(cb_lambda) {
        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data.cpanelresult.error) {
                        YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
                    }
                    else if (data.cpanelresult.data) {              
                        var html = CloudFlare.build_dnszone_table_markup(data.cpanelresult.data);
                        YAHOO.util.Dom.get("user_records_div").innerHTML = 
                            '<a name="user_recs_' + this.ACTIVE_DOMAIN + '"></a>' + html;

                        // Now add in tool tips
                        for (var i=0; i<CloudFlare.NUM_RECS; i++) {
                            new YAHOO.widget.Tooltip("tt_cf_enabled_"+i, { 
                                context: "cloudflare_table_edit_"+i, 
                                text: CloudFlare.REC_TEXT[i],
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
                    console.log(e);
                    console.log(this);
                    console.log(CloudFlare);
                    CloudFlare.display_error("add_CNAME_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
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
            "domain" : this.ACTIVE_DOMAIN,
            "homedir" : USER_HOME_DIR
        };
        
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + " [This may take several minutes]</div>";
    },

    // fetch zone records and build the global records cache
    refresh_records: function(cb_lambda) {
        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data.cpanelresult.error) {
                        YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
                    }
                    else if (data.cpanelresult.data) {              

                        // only build the cache
                        CloudFlare.build_dnszone_cache(data.cpanelresult.data);

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
                    CloudFlare.display_error("add_CNAME_status_bar", "error", CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
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
            "domain" : this.ACTIVE_DOMAIN,
            "homedir" : USER_HOME_DIR
        };
        
        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + " [This may take several minutes]</div>";
    },

    push_all_off: function () {

        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    if (data.cpanelresult.error) {
                        CloudFlare.update_user_records_table(function() {
                            CloudFlare.display_error("status_bar_" + 0, "error", 
                                                      CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                        });
                    } else if (data.cpanelresult.data[0].result == "error") {
                        CloudFlare.update_user_records_table(function() {
                            CloudFlare.display_error("status_bar_" + 0, "error", 
                                                      CPANEL.lang.json_error, 
                                                      data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                        });
                    }
                    else {
                        CloudFlare.update_user_records_table();
                    }
                }
                catch (e) {
                    CloudFlare.update_user_records_table(function() {
                        CloudFlare.display_error("status_bar_" + 0, "error", 
                                                  CPANEL.lang.json_error, CPANEL.lang.json_parse_failed);
                    });
                }
            },
            failure : function(o) {            
                YAHOO.util.Dom.get("status_bar_" + 0).innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
            }
        };
        
        var cf_zones = [];
        for (key in this.CF_RECS) {
            if (this.CF_RECS[key]) {
                cf_zones.push(key+":"+CF_RECS[key]);
            }
        }

        // send the AJAX request
        var api2_call = {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "cpanel_jsonapi_func" : "zone_delete",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_key" : USER_ID,
            "subdomains" : cf_zones.join(","),
            "homedir" : USER_HOME_DIR
        };

        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
    },

    toggle_www_on: function(domain) {
        this.reset_form();
        this.ACTIVE_DOMAIN = domain;
        var lambda = function() {
            if (this.WWW_DOM_INFO[2]) {
                this.toggle_record_on(this.WWW_DOM_INFO[0], this.WWW_DOM_INFO[1], this.sWWW_DOM_INFO[2]);
            }
        }
        this.update_user_records_table(lambda);
        return false;
    },

    toggle_all_off: function(domain) {
        this.reset_form();
        this.ACTIVE_DOMAIN = domain;
        this.refresh_records(this.push_all_off);
        return false;
    },

    enable_domain: function(domain) {
        this.reset_form();
        console.log(domain);
        this.set_domain(domain);
        return false;
    },

    change_cf_accnt: function() {
        window.open('https://www.cloudflare.com/cloudflare-settings.html?z='+this.ACTIVE_DOMAIN,'_blank');    
    },

    change_cf_setting: function (domain, action, value) {
        this.ACTIVE_DOMAIN = domain;
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
                        CloudFlare.get_stats(domain);
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
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user_api_key" : USER_API_KEY,
            "v" : value,
            "a" : action,
            "homedir" : USER_HOME_DIR
        };

        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        return false;
    },

    hide_a_help: function(rec_num) {
        YAHOO.util.Dom.get("module_row_a_" + rec_num).innerHTML = '<td colspan="7"></td>';
        OPEN_HELP = -1;
    },

    show_a_help: function(rec_num, rec_name) {

        if (OPEN_HELP >= 0) {
            YAHOO.util.Dom.get("module_row_a_" + OPEN_HELP).innerHTML = '<td colspan="7"></td>';
        }
        YAHOO.util.Dom.get("module_row_a_" + rec_num).innerHTML = '<td colspan="7"><div style="padding: 20px">A type records cannot be directly routed though the CloudFlare network. Instead, click <a href="../zoneedit/advanced.html">here</a> and either switch the type of ' + rec_name + ' to CNAME, or else make a new CNAME record pointing to ' + rec_name + '</div></td>';
        OPEN_HELP = rec_num;

        return false;
    },

    showHelp: function(type) {

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
    },

    set_railgun: function (domain, value) {
        this.ACTIVE_DOMAIN = domain;
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

        tag = YAHOO.util.Dom.get(value).value;
        
        var action = "set_railgun";
        
        if (tag == "remove")
             action = "remove_railgun";
        
        // send the AJAX request
        var api2_call = {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "cpanel_jsonapi_func" : action,
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user_api_key" : USER_API_KEY,
            "tag" : tag,
            "homedir" : USER_HOME_DIR
        };

        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        return false;
    },

    set_railgun_mode: function (domain, value, mode) {
        this.ACTIVE_DOMAIN = domain;
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

        tag = YAHOO.util.Dom.get(value).value;
        
        var action = "enabled";
        
        if (YAHOO.util.Dom.get(mode).value == "0")
             action = "disabled";
            
        // send the AJAX request
        var api2_call = {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "cpanel_jsonapi_func" : "set_railgun_mode",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user_api_key" : USER_API_KEY,
            "tag" : tag,
            "mode" : action,
            "homedir" : USER_HOME_DIR
        };

        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        return false;
    },

    get_stats: function(domain) {
        this.reset_form();
        this.ACTIVE_DOMAIN = domain;

        var callback = {
            success : function(o) {
                try {
                    var data = YAHOO.lang.JSON.parse(o.responseText);
                    console.log(data);
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
                                    "zone_name" : this.ACTIVE_DOMAIN,
                                  "user_email" : USER_EMAIL,
                                  "user_api_key" : USER_API_KEY,
                                  "homedir" : USER_HOME_DIR
                                };
                        
                                 connection = YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');                                                          
                      } 
                      
                      getActiveRailguns(domain); 




                        if (typeof data.cpanelresult.data[0].response.result != undefined) {
                            // Display stats here.
                            var result = data.cpanelresult.data[0].response.result;
                            var stats = result.objs[0];

                            html = CFT['statistics']({'stats': stats, 'result': result});

                            html += CFT['performance'](stats);
                        } // END of check for stats

                        YAHOO.util.Dom.get("user_records_div").innerHTML = html;

                        var railgunList;                     

                         function process_rg_response(data)
                         {
                           var rg_html="";
                           
                           if (data != null)
                           {
                               
                              railgunList = data;
                                                    
                              rg_html +=     '<div class="control-label"><label>Railgun <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'railgun\')"></i></span></label></div>';
                              rg_html +=     '<div class="controls">';
                              rg_html +=        '<select name="Railgun" id="Railgun" onChange="set_railgun(\''+ domain+'\',' + '\'Railgun\')">';
                                                        
                              rg_html += '<option value="remove">Railgun Not Selected</option>';
                                                        
                              var suppress = false;
                              var preSelected = false;    
                                                                                               
                              for( var i = 0; i < railgunList.length; i++ )
                              {                       
                                  rg_html += '<option value="' + railgunList[i].railgun_tag + '" '; 
                                  if ( (activeRailgun != null) && (activeRailgun.railgun_pubname == railgunList[i].railgun_pubname) )
                                  { 
                                     rg_html += 'selected' 
                                     preSelected = true;
                                  }                           
                                  
                                  rg_html += '>' + railgunList[i].railgun_pubname; 
                                  
                                  if (railgunList[i].railgun_mode == "0")
                                     {
                                        rg_html += ' (Disabled)';
                                        suppress = true;
                                     }   
                                  
                                  rg_html += '</option>';
                               }
                                                                            
                              rg_html += '</select>';
                              
                              if (preSelected) 
                              {
                                  if(!suppress)
                                  {
                                     rg_html += ' '
                                     rg_html += '<select name="RailgunStatus" id="RailgunStatus" onChange="set_railgun_mode(\''+ domain+'\',' + '\'Railgun\', \'RailgunStatus\')">';
                                     rg_html += '<option value="0">Off</option>'
                                     rg_html += '<option value="1"' + ( (activeRailgun.railgun_conn_mode == "1")? 'selected':'' ) + '>On</option>';
                                     rg_html += '</select>';
                                  }
                              }               
                            
                              YAHOO.util.Dom.get("rglist").innerHTML = rg_html;
                            }
                               
                         }

                        setTimeout(function (domain)
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
                                    "zone_name" : this.ACTIVE_DOMAIN,
                                  "user_email" : USER_EMAIL,
                                  "user_api_key" : USER_API_KEY,
                                  "homedir" : USER_HOME_DIR
                                };
                        
                                 connection = YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');                                                          
                      }, 500);
                      
                      
                    
                    }
                }
                catch (e) {
                    console.log(e);
                    YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + e + "</div>";
                }
            },
            failure : function(o) {    
                YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.error + " " + CPANEL.lang.ajax_error + ": " + CPANEL.lang.ajax_try_again + "</div>";
            }
        };
        
        var cf_zones = [];
        for (key in this.CF_RECS) {
            if (this.CF_RECS[key]) {
                cf_zones.push(key);
            }
        }

        // send the AJAX request
        var api2_call = {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "cpanel_jsonapi_func" : "zone_get_stats",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user_api_key" : USER_API_KEY,
            "homedir" : USER_HOME_DIR
        };
        
        

        YAHOO.util.Connect.asyncRequest('GET', CPANEL.urls.json_api(api2_call), callback, '');
        YAHOO.util.Dom.get("user_records_div").innerHTML = '<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>";

        return false;
    },

    init: function() {
        // initialize object variables
        this.reset_form();

        // New signups
        var oUserSub = document.getElementById("USER_submit");
        YAHOO.util.Event.addListener(oUserSub, "click", this.signup_to_cf);
        
        this.add_validation();
        
        // load the table
        if (this.ACTIVE_DOMAIN != null) {
            this.update_user_records_table();
        }

        // make all methods available on the base object
        var CF = this;
        $.each(this.prototype, function(index, value) {
            if (typeof value == "function") {
                CF[index] = value;
            }
        })

        return this;
    }
});

CloudFlare.$(function(){ window.CF = new CloudFlare(); });
