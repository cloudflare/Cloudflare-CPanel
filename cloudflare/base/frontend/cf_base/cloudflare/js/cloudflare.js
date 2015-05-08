
var CloudFlare = function() {
    return CloudFlare.init();
};

CloudFlare.fn = CloudFlare.prototype = {
};

// attach jQuery in to the cloudflare object
CloudFlare.$ = CF_jQuery;

_.extend(CloudFlare, {

    ACTIVE_DOMAIN: null,
    ACTIVE_SECTION: null,

    /* -- Start helper methods -- */

    reset_form: function() {
        this.VALID = [];
        this.CF_RECS = {};
        this.NUM_RECS = 0;
        this.REC_TEXT = [];
        this.WWW_DOM_INFO = [];
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
        $ = CloudFlare.$;

        var $wrapper = $('#notifications .global-notifications');

        if ($wrapper.length > 0) {
            html = CFT['error']({
                type: type,
                header: header,
                message: message
            });

            $(html).appendTo($wrapper).delay(10000).queue(function() { $(this).remove(); });
        } else {
            alert(message);
        }
    },

    showHelp: function(type) {
        var message = CF_LANG.help[type] || "Error loading help message";

        if ('DN' in window) {

            var help_lightbox;
            if ('CF' in window && 'lightbox' in window.CF) {
                help_lightbox = window.CF.lightbox;
                help_lightbox.cfg.contentString = message;
            } else {
                window.CF = window.CF || {};
                window.CF.lightbox = help_lightbox = new DN.Lightbox({
                    contentString: message,
                    animate: false,
                    maxWidth: 500
                });
            }
            help_lightbox.show.call(help_lightbox, this);
        }

        return false;
    },

    ajax: function(data, callback, context, settings) {
        var data = data || {};
        var settings = settings || {};
        var callback = callback || {};

        // Add cpanel specific data
        _.extend(data, {
            "cpanel_jsonapi_version" : 2,
            "cpanel_jsonapi_module" : "CloudFlare",
            "homedir" : USER_HOME_DIR
        });

        var errorhandler = function(xhr, status) {
            // check if a context was set, and if so display error in that context
            if (typeof this.xhr == "undefined") {
                $(this).html('<div style="padding: 20px">' + CPANEL.icons.error + ' ' + CPANEL.lang.ajax_error + ': ' + CPANEL.lang.ajax_try_again + '</div>');
            }

            if (callback.error && typeof callback.error == "function") {
                callback.error.apply(this, [xhr]);
            }

            CloudFlare.display_error("error", CPANEL.lang.Error, CPANEL.lang.ajax_try_again + '<br>' + (status ? status : ''));
        };

        // define existing settings
        _.extend(settings, {
            url: CPANEL.urls.json_api(),
            data: data,
            success: function(resp, status, xhr) {
                try {
                    var data = $.parseJSON(resp);
                    // callback can set 'handlesError' to true to skip this error response and allow the callback's success function to handle the error separately
                    if (!callback.handlesError && (data.cpanelresult.error || data.cpanelresult.data[0].result == "error")) {
                        throw "Error response: " + (data.cpanelresult.error || data.cpanelresult.data[0].msg || '');
                    } else {
                        if (callback.success && typeof callback.success == "function") {
                            callback.success.apply(this, [data]);
                        }
                    }
                } catch (e) {
                    msg = e.message || e || '';
                    errorhandler.apply(this,[xhr, msg]);
                }
            },
            error: errorhandler
        });

        if (context) {
            settings.context = context;
            $(context).html('<div style="padding: 20px">' + CPANEL.icons.ajax + ' ' + CPANEL.lang.ajax_loading + '</div>');
        }

        $.ajax(settings);
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

        // add toggle listener
        CloudFlare.$(document).on('click', '.toggle', function() {
            $target = $('#' + $(this).attr('data-target'));
            $target.removeClass('hide');

            if ($(this).hasClass('show-only')) {
                $target.show();
            } else if ($(this).hasClass('hide-only')) {
                $target.hide();
            } else {
                $target.toggle();
            }
        });

        return this;
    },

    /* -- Start action methods -- */

    signup_to_cf: function() {
        /* TODO: Move this to validation system */
        var tos = YAHOO.util.Dom.get("USER_tos").checked,
            signup_welcome, signup_info, creating_account;
        if (!tos) {
            CloudFlare.display_error("error", CPANEL.lang.Error, "Please agree to the Terms of Service before continuing.");
            return false;
        }
        
        var callback = {
            handlesError: true,
            success: function(data) {
                $("#add_USER_record_status").html('');
                $(this).html('');
                
                if (data.cpanelresult.data[0].result == 'success') {
                    signup_welcome = CloudFlare.get_lang_string('signup_welcome');
                    signup_info = CloudFlare.get_lang_string('signup_info', {email: data.cpanelresult.data[0].response.cloudflare_email});
                    
                    CloudFlare.display_error("success", signup_welcome, signup_info);
                    // After 8 sec, reload the page
                    setTimeout('window.location.reload(true)', 8000);
                }
                else {
                    $("#add_USER_record_button").show();
                    
                    if (data.cpanelresult.data[0].err_code == 124) {
                        $("#cf_pass_noshow").show();
                        CloudFlare.display_error("error", CPANEL.lang.Error, "This email is already signed up with CloudFlare. Please provide the user's CloudFlare password to continue.");
                    } else {
                        CloudFlare.display_error("error", CPANEL.lang.Error, data.cpanelresult.data[0].msg.replace(/\\/g, ""));
                    }
                }
            },
            error: function(o) {
                $("#add_USER_record_button").show();
                $("#add_USER_record_status").html('');
            }
        };
        
        // send the request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "user_create",
            "user" : YAHOO.util.Dom.get("USER_user").value,
            "email" : YAHOO.util.Dom.get("USER_email").value,
            "password" : YAHOO.util.Dom.get("USER_pass").value,
        }, callback, $('#add_USER_status_bar'));
        
        $("#add_USER_record_button").hide();
        creating_account = CloudFlare.get_lang_string('creating_account');
        $("#add_USER_record_status").html(CPANEL.icons.ajax + " " + creating_account);
    },

    /* TODO: Add validation */
    add_validation: function() {},

    update_zones: function(rec_num, orig_state, old_rec, old_line) {
        var tooltip = '', records;

        var callback = {
            success: function(data) {
                CloudFlare.update_user_records_rows([rec_num]);
            },
            error: function() {
                CloudFlare.update_user_records_table();
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
            "cpanel_jsonapi_func" : "zone_set",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_key" : USER_ID,
            "subdomains" : cf_zones.join(","),
            "cf_recs" : YAHOO.lang.JSON.stringify(this.CF_RECS)
        };

        if (old_rec) {
            api2_call["old_rec"] = old_rec;
            api2_call["old_line"] = old_line;
        }

        CloudFlare.ajax(api2_call, callback, $('#status_bar_' + rec_num));
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
        this.NUM_RECS = records.length;
        var tooltip_zone_cf_on = this.get_lang_string('tooltip_zone_cf_on'),
            tooltip_zone_cf_off = this.get_lang_string('tooltip_zone_cf_off');
        for (var i=0; i<records.length; i++) {
            // CNAME records
            if (records[i]['type'].match(/^(CNAME)$/)) {
                if (records[i]['cloudflare'] == 1) {
                    // Add the zone to our list of CF zones.
                    this.CF_RECS[records[i]['name']] = records[i]['line'];
                    this.REC_TEXT[i] = tooltip_zone_cf_on;
                } else {
                    this.REC_TEXT[i] = tooltip_zone_cf_off;
                }

                if (records[i]['name'].match(/^(www\.)/)) {
                    this.WWW_DOM_INFO = [i, records[i]['name'], records[i]['line']];
                }
            }
        }
    },

    // Builds the Zone List.
    build_dnszone_table_markup: function(records) {
        var domain = this.ACTIVE_DOMAIN;

        if (records.length < 1) {
            return '';
        }

        // Setup cache data (NUM_RECS, CF_RECS, REC_TEXT, WWW_DOM_INFO)
        this.build_dnszone_cache(records);

        html = CFT['zones']({records: records});

        // Set the global is CF powered text.
        if (this.NUM_RECS > 0) {
            zone_row = CFT['zone']({cloudflare: this.is_domain_cf_powered(records), domain: domain, action: 'enable_domain', action_text: 'Manage', 'toggleable': true});
            $('tr[data-zone="' + domain + '"').replaceWith(zone_row);
        }

        return html;
    },

    // Assuming the user records table is showing the table already,
    // just redraw the rows given by num_rows, i.e. [1,2,3]
    update_user_records_rows: function(row_nums, cb_lambda) {
        var domain = this.ACTIVE_DOMAIN;
        var callback = {
            success: function(data) {
                CloudFlare.build_dnszone_cache.apply(CloudFlare, [data.cpanelresult.data]);
                for (var i=0, l=row_nums.length; i<l; i++) {
                    var v = row_nums[i];
                    var row_html = CFT['zone_record']({type: "CNAME", rec_num: v, record: data.cpanelresult.data[v]});

                    $('#info_row_' + v).html(row_html);

                    new YAHOO.widget.Tooltip("tt_cf_enabled_"+v, { 
                        context: "cloudflare_table_edit_"+v, 
                        text: CloudFlare.REC_TEXT[v],
                        showDelay: 300
                    });
                }

                // Set the global is CF powered text.
                if (CloudFlare.NUM_RECS > 0) {
                    zone_row = CFT['zone']({cloudflare: CloudFlare.is_domain_cf_powered(data.cpanelresult.data), domain: domain, action: 'enable_domain', action_text: 'Manage', 'toggleable': true});
                    $('tr[data-zone="' + domain + '"').replaceWith(zone_row);
                }

                // Call the cb, if it is set.
                if (cb_lambda) {
                    cb_lambda();
                }

                // Scroll to the edit anchor
                var yoffset = YAHOO.util.Dom.getY('user_records_div');
                window.scrollTo(0, yoffset);
            }
        };
        
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "fetchzone",
            "domain" : this.ACTIVE_DOMAIN
        }, callback);

        for(var i=0, l=row_nums.length; i<l; i++) {
            var rec_num = row_nums[i];
            $("#cloudflare_table_edit_" + rec_num).html('<div style="padding: 20px">' + CPANEL.icons.ajax + " " + CPANEL.lang.ajax_loading + "</div>");
        }
    },


    update_user_records_table: function(cb_lambda) {
        var callback = {
            success: function(data) {
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
        };
        
        // send the AJAX request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "fetchzone",
            "domain" : this.ACTIVE_DOMAIN
        }, callback, $('#user_records_div'));
    },

    // fetch zone records and build the global records cache
    refresh_records: function(cb_lambda) {
        var callback = {
            success: function(data) {
                // only build the cache
                CloudFlare.build_dnszone_cache(data.cpanelresult.data);

                // Call the cb, if it is set.
                if (cb_lambda) {
                    cb_lambda();
                }
            }
        };
        
        // send the AJAX request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "fetchzone",
            "domain" : this.ACTIVE_DOMAIN
        }, callback, $('#user_records_div'));
    },

    push_all_off: function () {

        var callback = {
            success: function(data) {
                CloudFlare.update_user_records_table();
            }
        };
        
        var cf_zones = [];
        for (key in CloudFlare.CF_RECS) {
            if (CloudFlare.CF_RECS[key]) {
                cf_zones.push(key+":"+CloudFlare.CF_RECS[key]);
            }
        }

        // send the AJAX request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "zone_delete",
            "zone_name" : CloudFlare.ACTIVE_DOMAIN,
            "user_key" : USER_ID,
            "subdomains" : cf_zones.join(",")
        }, callback, $('#status_bar_' + 0));
    },

    toggle_www_on: function(domain) {
        this.reset_form();
        this.ACTIVE_DOMAIN = domain;
        var lambda = function() {
            if (CloudFlare.WWW_DOM_INFO[2]) {
                CloudFlare.toggle_record_on(CloudFlare.WWW_DOM_INFO[0], CloudFlare.WWW_DOM_INFO[1], CloudFlare.WWW_DOM_INFO[2]);
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

    change_cf_accnt: function() {
        window.open('https://www.cloudflare.com/cloudflare-settings.html?z='+this.ACTIVE_DOMAIN,'_blank');    
    },

    change_cf_setting: function (domain, action, value) {
        this.ACTIVE_DOMAIN = domain;
        var callback = {
            success: function(data) {
                CloudFlare.load_zone_features(CloudFlare.ACTIVE_SECTION);
                return false;
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
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "zone_edit_cf_setting",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user": USER,
            "v" : value,
            "a" : action
        }, callback, $('#user_records_div'));
        return false;
    },

    show_a_help: function(rec_num, rec_name) {
        $('.open-help').remove();
        $("#module_row_a_" + rec_num).html('<td colspan="7"><div style="padding: 20px" class="open-help">A type records cannot be directly routed though the CloudFlare network. Instead, click <a href="../zoneedit/advanced.html">here</a> and either switch the type of ' + rec_name + ' to CNAME, or else make a new CNAME record pointing to ' + rec_name + '</div></td>');

        return false;
    },

    set_railgun: function (domain, value) {
        this.ACTIVE_DOMAIN = domain;
        var callback = {
            success: function(data) {
                CloudFlare.set_domain(domain, 'get_performance');
                return false;
            }
        };

        tag = YAHOO.util.Dom.get(value).value;
        
        var action = "set_railgun";
        
        if (tag == "remove")
             action = "remove_railgun";
        
        // send the AJAX request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : action,
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user": USER,
            "tag" : tag
        }, callback, $('#user_records_div'));
        return false;
    },

    set_railgun_mode: function (domain, value, mode) {
        this.ACTIVE_DOMAIN = domain;
        var callback = {
            success: function(data) {
                CloudFlare.set_domain(domain, 'get_performance');
                return false;
            }
        };

        tag = YAHOO.util.Dom.get(value).value;
        
        var action = "enabled";
        
        if (YAHOO.util.Dom.get(mode).value == "0")
             action = "disabled";
            
        // send the AJAX request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "set_railgun_mode",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user": USER,
            "tag" : tag,
            "mode" : action
        }, callback, $('#user_records_div'));
        return false;
    },

    // This function serves as the main entry point for each page (overview, security, performance, and analytics)
    set_domain: function(domain, type) {
        this.reset_form();
        this.ACTIVE_DOMAIN = domain;

        switch (type) {
            case 'enable_domain':
                this.enable_domain();
                break;
            default:
                this.ACTIVE_SECTION = type;
                this.load_zone_features(type);
                break;
        }
        

        return false;
    },

    enable_domain: function() {
        if (this.ACTIVE_DOMAIN == null) {
            $("#add_record_and_zone_table").slideUp(CPANEL.JQUERY_ANIMATION_SPEED);
        }
        else {
            $("#add_record_and_zone_table").slideDown(CPANEL.JQUERY_ANIMATION_SPEED);
            this.update_user_records_table();
        }
    },

    // if the api gets split to pull stats and settings separately, then this function needs to get split as well
    load_zone_features: function(type) {
        var callback = {
            success: function(data) {
                html = '';
                if (typeof data.cpanelresult.data[0].response.result != "undefined") {
                    var result = data.cpanelresult.data[0].response.result;
                    var stats = result.objs[0];

                    html = CloudFlare[type](result, stats, CloudFlare.ACTIVE_DOMAIN);
                }

                $(this).html(html);
            }
        };

        // hack to confirm that the domain is currently powered by CloudFlare
        if (!$('tr[data-zone="' + this.ACTIVE_DOMAIN + '"] span.label').hasClass('label-success')) {
            $('#user_records_div').html('<h4>Activate this domain on CloudFlare before managing this zone.</h4><p><a href="index.html" class="btn btn-success">Manage CloudFlare Sites</a></p>');
            return false;
        }

        // send the AJAX request
        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "zone_get_stats",
            "zone_name" : this.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user": USER
        }, callback, $('#user_records_div'));
    },

    get_performance: function(result, stats, domain) {
        var activeRailgun;

        var callback1 = {
            success: function(data) {
                if (data.cpanelresult.data[0].response.railgun_conn.obj == null) {
                   activeRailgun = null;
                } else {
                   activeRailgun = data.cpanelresult.data[0].response.railgun_conn.obj;
                }
            }
        };

        CloudFlare.ajax({
            "cpanel_jsonapi_func" : "get_active_railguns",
            "zone_name" : CloudFlare.ACTIVE_DOMAIN,
            "user_email" : USER_EMAIL,
            "user": USER
        }, callback1);

        setTimeout(function ()
        {
            var callback2 = {
                success: function(data) {
                    railgunList = data.cpanelresult.data[0].response.railguns.objs;
                    if (railgunList != null) {
                        rg_html = CFT['railgun']({'railgunList': railgunList, 'domain': domain, 'activeRailgun': activeRailgun});
                        YAHOO.util.Dom.get("rglist").innerHTML = rg_html;
                    } 
                }
            };

            CloudFlare.ajax({
                "cpanel_jsonapi_func" : "get_railguns",
                "zone_name" : CloudFlare.ACTIVE_DOMAIN,
                "user_email" : USER_EMAIL,
                "user": USER
            }, callback2);                                                         
        }, 500);

        return CFT['performance']({'stats': stats, 'domain': domain});
    },

    get_stats: function(result, stats, domain) {
        return CFT['statistics']({'stats': stats, 'result': result, 'domain': domain});
    },

    get_security: function(result, stats, domain) {
        return CFT['security']({'stats': stats, 'domain': domain});
    }
});

CloudFlare.$(function(){ window.CF = new CloudFlare(); });
