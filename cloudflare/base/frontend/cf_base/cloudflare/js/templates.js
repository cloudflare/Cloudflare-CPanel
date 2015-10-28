this["CFT"] = this["CFT"] || {};

this["CFT"]["error"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div role="alert" class="alert ' +
((__t = ( type )) == null ? '' : __t) +
'">\n    <span class="message"><p><strong>' +
((__t = ( header )) == null ? '' : __t) +
'</strong> ' +
((__t = ( message )) == null ? '' : __t) +
'</p></span>\n</div>\n';

}
return __p
};

this["CFT"]["help"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '';

}
return __p
};

this["CFT"]["performance"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {


var dev_mode    = stats.dev_mode * 1000;
var local_time  = new Date();
var timeOffset  = local_time.getTimezoneOffset() * 60 * 1000;
;
__p += '\n\n<a NAME="infobox"></a>\n<h4>CloudFlare Performance Settings for ' +
((__t = ( domain )) == null ? '' : __t) +
'</h4>\n<fieldset id="table_dns_zone" class="form-horizontal">\n\n<div class="control-group">\n    <div class="control-label"><label>Account Type <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'pro\')"></i></span></label></div>\n    <div class="controls">\n        <select name="AccountType" id="AccountType" onChange="CloudFlare.change_cf_accnt()">\n            <option value="free" ';
 print(((!stats.pro_zone)? 'selected': '')) ;
__p += '>Free</option>\'\n            <option value="pro" ';
 print(((stats.pro_zone)? 'selected': '')) ;
__p += '>CloudFlare Pro</option>\'\n        </select>\n    </div>\n</div>\n\n<div class="control-group">\n    <div class="control-label"><label>Development Mode <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'devmode\')"></i></span></label></div>\n    <div class="controls">\n        ';
 if (dev_mode > stats.currentServerTime) { ;
__p += '\n            <a href="javascript:void(0);" class="btn btn-success" onclick="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'devmode\', 0)">Disable</a> \n            <span class="label label-danger">Ends at ';
 print(YAHOO.util.Date.format(new Date(dev_mode), {format: "%D %T"})) ;
__p += '</span>\n        ';
 } else {  ;
__p += '\n            <a href="javascript:void(0);" class="btn btn-danger btn-small" onclick="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'devmode\', 1)">Enable</a> \n            <span class="label label-success">Currently Off</span>\n        ';
 }  ;
__p += '\n    </div>\n</div>\n\n<div class="control-group">\n    <div class="control-label"><label>Cache Purge <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'fpurge_ts\')"></i></span></label></div>\n    <div class="controls">\n        <a href="javascript:void(0);" class="btn btn-danger btn-small" onclick="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'fpurge_ts\', 1)">Purge</a>\n    </div>\n</div>\n\n<div class="control-group">\n    <div class="control-label"><label>Always Online <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'ob\')"></i></span></label></div>\n    <div class="controls">\n        <select name="AlwaysOnline" id="AlwaysOnline" onChange="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'ob\', \'AlwaysOnline\')">\n            <option value="0" ';
 print(((stats.ob == "0")? 'selected': '')) ;
__p += '>Off</option>\'\n            <option value="1" ';
 print(((stats.ob == "1")? 'selected': '')) ;
__p += '>On</option>\'\n        </select>\n    </div>\n</div>\n\n<div class="control-group">\n    <div class="control-label"><label>Automatic IPv6 <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'ipv46\')"></i></span></label></div>\n    <div class="controls">\n        <select name="AutomaticIPv6" id="AutomaticIPv6" onChange="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'ipv46\', \'AutomaticIPv6\')">\n            <option value="0" ';
 print(((stats.ipv46 == "0")? 'selected': '')) ;
__p += '>Off</option>\'\n            <option value="3" ';
 print(((stats.ipv46 == "3")? 'selected': '')) ;
__p += '>Full</option>\'\n        </select>\n    </div>\n</div>\n\n<div class="control-group">\n    <div class="control-label"><label>Caching Level <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'cache_lvl\')"></i></span></label></div>\n    <div class="controls">\n        <select name="CachingLevel" id="CachingLevel" onChange="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'cache_lvl\', \'CachingLevel\')">\n            <option value="agg" ';
 print(((stats.cache_lvl == "agg")? 'selected': '')) ;
__p += '>Aggressive</option>\'\n            <option value="basic" ';
 print(((stats.cache_lvl == "basic")? 'selected': '')) ;
__p += '>Basic</option>\'\n        </select>\n    </div>\n</div>\n\n<div id="rglist" class="control-group"> \n</div>\n\n</fieldset>\n<p>For more statistics and settings, sign into your account at <a href="https://www.cloudflare.com/analytics" target="_blank">CloudFlare</a>.</p>\n';

}
return __p
};

this["CFT"]["railgun"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class="control-label">\n    <label>Railgun <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'railgun\')"></i></span></label>\n</div>\n\n<div class="controls">\n    <select name="Railgun" id="Railgun" onChange="CloudFlare.set_railgun(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\',\'Railgun\')">\n        <option value="remove">Railgun Not Selected</option>\n        ';

        var suppress = false;
        var preSelected = false;
        var rg_html;   
                                                                   
        for( var i = 0; i < railgunList.length; i++ ) {                       
            rg_html += '<option value="' + railgunList[i].railgun_tag + '" '; 
            if ( (activeRailgun != null) && (activeRailgun.railgun_pubname == railgunList[i].railgun_pubname) ) { 
                rg_html += 'selected' 
                preSelected = true;
            }                           

            rg_html += '>' + railgunList[i].railgun_pubname; 

            if (railgunList[i].railgun_mode == "0") {
                rg_html += ' (Disabled)';
                suppress = true;
            }   

            rg_html += '</option>';
        }

        print(rg_html);
        ;
__p += '\n    </select>\n\n    ';

    if (preSelected) {
        if(!suppress) { ;
__p += '\n            <select name="RailgunStatus" id="RailgunStatus" onChange="CloudFlare.set_railgun_mode(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\',\'Railgun\', \'RailgunStatus\')">\n            <option value="0">Off</option>\n            <option value="1"';
 print( (activeRailgun.railgun_conn_mode == "1")? ' selected':'' ) ;
__p += '>On</option>\n            </select>\n        ';
 }
    } ;
__p += '\n</div>\n';

}
return __p
};

this["CFT"]["security"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {


var dev_mode    = stats.dev_mode * 1000;
var local_time  = new Date();
var timeOffset  = local_time.getTimezoneOffset() * 60 * 1000;             
;
__p += '\n\n<a NAME="infobox"></a>\n<h4>CloudFlare Security Settings for ' +
((__t = ( domain )) == null ? '' : __t) +
'</h4>\n<fieldset id="table_dns_zone" class="form-horizontal">\n\n<div class="control-group">\n    <div class="control-label"><label>Account Type <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'pro\')"></i></span></label></div>\n    <div class="controls">\n        <select name="AccountType" id="AccountType" onChange="CloudFlare.change_cf_accnt()">\n            <option value="free" ';
 print(((!stats.pro_zone)? 'selected': '')) ;
__p += '>Free</option>\'\n            <option value="pro" ';
 print(((stats.pro_zone)? 'selected': '')) ;
__p += '>CloudFlare Pro</option>\'\n        </select>\n    </div>\n</div>\n\n<div class="control-group">\n    <div class="control-label"><label>Security Setting <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'seclvl\')"></i></span></label></div>\n    <div class="controls">\n        <select name="SecurityLevelSetting" id="SecurityLevelSetting" onChange="CloudFlare.change_cf_setting(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'sec_lvl\', \'SecurityLevelSetting\')">\n            <option value="high" ';
 print(((stats.userSecuritySetting == "High")? 'selected': '')) ;
__p += '>High</option>\'\n            <option value="med" ';
 print(((stats.userSecuritySetting == "Medium")? 'selected': '')) ;
__p += '>Medium</option>\'\n            <option value="low" ';
 print(((stats.userSecuritySetting == "Low")? 'selected': '')) ;
__p += '>Low</option>\'\n            <option value="eoff" ';
 print(((stats.userSecuritySetting == "Essentially Off")? 'selected': ''));
__p += '>Essentially Off</option>\'\n            <option value="help" ';
 print(((stats.userSecuritySetting == "I'm under attack!")? 'selected': '')) ;
__p += '>I\'m under attack!</option>\'\n        </select>\n    </div>\n</div>\n\n</fieldset>\n<p>For more statistics and settings, sign into your account at <a href="https://www.cloudflare.com/analytics" target="_blank">CloudFlare</a>.</p>\n';

}
return __p
};

this["CFT"]["statistics"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {


var numberFormat = {decimalPlaces:0, decimalSeparator:".", thousandsSeparator:","};
var numberFormatFloat = {decimalPlaces:2, decimalSeparator:".", thousandsSeparator:","};
var start = new Date(parseInt(result.timeZero));
var end = new Date(parseInt(result.timeEnd));
var html;
;
__p += '\n\n<h4>Basic Statistics for ' +
((__t = ( domain )) == null ? '' : __t) +
'\n';
 if (start > end) { ;
__p += '\n    </h4>\n    <p>Basic statistics update every 24 hours for the free service. For 15 minute statistics updates, advanced security and faster performance, upgrade to the <a href="https://www.cloudflare.com/plans" target="_blank">Pro service</a>.</p>\n';
 } else { ;
__p += '\n    ';

    var start_fm = YAHOO.util.Date.format(start, {format:"%B %e, %Y"});
    var end_fm = YAHOO.util.Date.format(end, {format:"%B %e, %Y"});
    if (start_fm === end_fm) { ;
__p += '\n        <br />\n        ' +
((__t = ( start_fm )) == null ? '' : __t) +
'\n    ';
 } else { ;
__p += '\n        <br />\n        ' +
((__t = ( start_fm )) == null ? '' : __t) +
' to ' +
((__t = ( end_fm )) == null ? '' : __t) +
'\n    ';
 } ;
__p += '\n    </h4>\n\n    <table id="table_dns_zone" class="table table-hover" border="0" cellspacing="0">\n    <thead>\n    <tr class="dt_header_row">\n        <th width="100">&nbsp;</th>\n        <th>regular traffic</th>\n        <th>crawlers/bots</th>\n        <th>threats</th>\n        <th>info</th>\n    </tr>\n    </thead>\n\n    <tbody>\n    <tr class="dt_module_row rowA">\n        <td width="100">Page Views</td>\n        <td style="text-align:center;">';
 print(YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.pageviews.regular), numberFormat)) ;
__p += '</td>\n        <td style="text-align:center;">';
 print(YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.pageviews.crawler), numberFormat)) ;
__p += '</td>\n        <td style="text-align:center;">';
 print(YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.pageviews.threat), numberFormat)) ;
__p += '</td>\n        <td style="text-align:center;"><span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'visits\')"></i></span></td>\n    </tr>\n\n    <tr class="dt_module_row rowB">\n        <td width="100">Unique Visitors</td>\n        <td style="text-align:center;">';
 print(YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.uniques.regular), numberFormat)) ;
__p += '</td>\n        <td style="text-align:center;">';
 print(YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.uniques.crawler), numberFormat)) ;
__p += '</td>\n        <td style="text-align:center;">';
 print(YAHOO.util.Number.format(parseInt(stats.trafficBreakdown.uniques.threat), numberFormat)) ;
__p += '</td>\n        <td style="text-align:center;"><span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'uniques\')"></td>\n    </tr>\n    </tbody>\n    </table>\n\n    ';

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
    ;
__p += '\n\n    <div id="analytics-stats">\n        <!--\n        ';
 if (percent_time) { 
            var max_time = 1.10 * Math.max(cloudflare_time, without_time); 
            var chart_api = 'https://chart.googleapis.com/chart?cht=bvs&chco=505151|e67300&chs=200x172&chbh=90,10,10&chd=t:'+without_time+','+cloudflare_time+'&chxt=x&chxl=0:|Without%20CloudFlare|With%20CloudFlare&chds=0,5&chm=N%20*f*%20sec.,000000,0,-1,11&chds=0,' + max_time;
            ;
__p += '\n\n            <div class="analytics-speed-column" id="analytics-speed-time">\n                <h4 class="analytics-chartTitle">\n                    <span class="analytics-chartTitle-inner">\n                        Page Load Time <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\\\'pageload\\\')"></i></span>\n                    </span>\n                </h4>\n\n                <table>\n                    <tr>\n                        <td>\n                            <span class="analytics-chart" id="analytics-speed-time-chart">\n                                <img src="';
 print(chart_api) ;
__p += '">\n                            </span>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td>\n                            <h5>CloudFlare makes your sites load about <span class="analytics-speed-info-percentFaster">';
 print(percent_time) ;
__p += '</span> faster.</h5>\n                        </td>\n                    </tr>\n                </table>\n            </div>\n        ';
 } else { ;
__p += '\n            <div class="analytics-speed-column" id="analytics-speed-time">\n                <h4 class="analytics-chartTitle">\n                    <span class="analytics-chartTitle-inner">\n                        Page Load Time <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\\\'pageload\\\')"></i></span>\n                    </span>\n                </h4>\n\n                The page load time comparison is currently gathering data.\n            </div>\n        ';
 } ;
__p += '\n        -->\n        <div class="columns two">\n            <div class="column">\n                <h4>Requests Saved <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'hits\')"></i></span></h4>\n                <table class="table">\n                    <tr>\n                        <td>\n                            <div class="analytics-chart" id="analytics-speed-requs-chart"> <img src="https://chart.googleapis.com/chart?cht=p&chco=ed7200|505151&chs=80x80&chd=t:';
 print(percent_reqs) ;
__p += ',';
 print((100.0 - percent_reqs)) ;
__p += '" width="80" height="80"> </div>\n                        </td>\n                        <td>\n                            <div class="analytics-speed-savedByCF"><span id="analytics-speed-reqs-savedByCF">';
 print(saved_reqs) ;
__p += '</span> requests saved by CloudFlare</div> <div class="analytics-speed-total"><span id="analytics-speed-reqs-total">';
 print(total_reqs) ;
__p += '</span> total requests</div>\n                        </td>\n                    </tr>\n                </table>\n            </div>\n            <div class="column">\n                <h4>Bandwidth Saved <span class="text-info"><i class="icon icon-info-sign" onclick="CloudFlare.showHelp(\'bandwidth\')"></i></span></h4>\n                <table class="table">\n                    <tr>\n                        <td> \n                            <div class="analytics-chart" id="analytics-speed-bandwidth-chart"> <img src="https://chart.googleapis.com/chart?cht=p&chco=ed7200|505151&chs=80x80&chd=t:';
 print(percent_bw) ;
__p += ',';
 print((100.0 - percent_bw)) ;
__p += '" width="80" height="80"> </div> \n                        </td>\n                        <td> \n                            <div class="analytics-speed-savedByCF"><span id="analytics-speed-bandwidth-savedByCF">';
 print(saved_bw + saved_units_bw) ;
__p += '</span> bandwidth saved by CloudFlare</div> <div class="analytics-speed-total"><span id="analytics-speed-bandwidth-total">';
 print(total_bw + total_units_bw) ;
__p += '</span> total bandwidth</div>  \n                        </td>\n                    </tr>\n                </table>\n            </div>    \n        </div>\n    </div>    \n    \n    <p><a href="http://www.cloudflare.com/a/analytics" target="_blank"><div id="analytics-cta" class="btn btn-primary">See more statistics</div></a></p>\n    \n    <p>Note: Basic statistics update every 24 hours. For 15 minute statistics updates, advanced security and faster performance, upgrade to the <a href="https://www.cloudflare.com/plans" target="_blank">Pro service</a>.</p>\n\n    <hr />\n\n';
 } ;
__p += '\n';

}
return __p
};

this["CFT"]["websites"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<h1>' +
((__t = ( name )) == null ? '' : __t) +
' is here</h1>\n';

}
return __p
};

this["CFT"]["zone"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {


   if (typeof toggleable == "undefined") {
    toggleable = false;
   }
;
__p += '\n<tr data-zone="' +
((__t = ( domain )) == null ? '' : __t) +
'">\n    <td><a href="javascript:void(0);" class="btn btn-primary" onclick="return CloudFlare.set_domain(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\', \'' +
((__t = ( action )) == null ? '' : __t) +
'\');">' +
((__t = ( action_text )) == null ? '' : __t) +
'</a></td>\n    <td>' +
((__t = ( domain )) == null ? '' : __t) +
'</td>\n\n\t';
 if (cloudflare)  { ;
__p += '\n\t    <td id="cf_powered_' +
((__t = ( domain )) == null ? '' : __t) +
'"><span class="label label-success">Powered by CloudFlare</span></td>\n\t    <td align="center" id="cf_powered_check' +
((__t = ( domain )) == null ? '' : __t) +
'"><img src="./images/icon-cloud-on.png" ';
 if (toggleable) { ;
__p += ' onclick="CloudFlare.toggle_all_off(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\')" ';
 } ;
__p += ' /></td>\n\t';
 } else { ;
__p += '\n\t    <td id="cf_powered_' +
((__t = ( domain )) == null ? '' : __t) +
'"><span class="label">Not Powered by CloudFlare</span></td>\n\t    <td align="center" id="cf_powered_check' +
((__t = ( domain )) == null ? '' : __t) +
'"><img src="./images/icon-cloud-bypass.png" ';
 if (toggleable) { ;
__p += ' onclick="CloudFlare.toggle_www_on(\'' +
((__t = ( domain )) == null ? '' : __t) +
'\')" ';
 } ;
__p += ' /></td>\n\t';
 } ;
__p += '\n</tr>\n';

}
return __p
};

this["CFT"]["zone_record"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (type == "CNAME") { ;
__p += '\n    <td id="name_value_' +
((__t = ( rec_num )) == null ? '' : __t) +
'">' +
((__t = ( record['type'] )) == null ? '' : __t) +
'</td>\n    <td id="type_value_' +
((__t = ( rec_num )) == null ? '' : __t) +
'">';
 print(record['name'].substring(0, record['name'].length - 1)) ;
__p += '</td>\n    \n    ';
 if (record['type'] == 'CNAME') { ;
__p += '\n        <td colspan="2" id="value_value_hehe_' +
((__t = ( rec_num )) == null ? '' : __t) +
'"><span class="text-nonessential">points to</span> ' +
((__t = ( record['cname'] )) == null ? '' : __t) +
'</td>\n    ';
 } ;
__p += '\n\n    <td>\n        ';
 if (record['cloudflare'] == 1) {      ;
__p += '           \n            <span class="action_link" id="cloudflare_table_edit_' +
((__t = ( rec_num )) == null ? '' : __t) +
'" onclick="CloudFlare.toggle_record_off(' +
((__t = ( rec_num )) == null ? '' : __t) +
', \'' +
((__t = ( record['name'] )) == null ? '' : __t) +
'\', \'' +
((__t = ( record['line'] )) == null ? '' : __t) +
'\' )">\n                <img src="./images/icon-cloud-on.png" class="cf_enabled" />\n            </span>\n        ';
 } else { ;
__p += '\n            <span class="action_link" id="cloudflare_table_edit_' +
((__t = ( rec_num )) == null ? '' : __t) +
'" onclick="CloudFlare.toggle_record_on(' +
((__t = ( rec_num )) == null ? '' : __t) +
', \'' +
((__t = ( record['name'] )) == null ? '' : __t) +
'\', \'' +
((__t = ( record['line'] )) == null ? '' : __t) +
'\' )">\n                <img src="./images/icon-cloud-bypass.png" class="cf_disabled' +
((__t = ( rec_num )) == null ? '' : __t) +
'"/>\n            </span>\n        ';
 } ;
__p += '\n    </td>\n';
 } ;
__p += '\n';

}
return __p
};

this["CFT"]["zones"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<h4>Website Records</h4>\n\n<table id="table_dns_zone" class="table table-hover" border="0" cellspacing="0" cellpadding="0">    \n    <thead>    \n        <tr class="dt_header_row">    \n            <th>type</th>    \n            <th>name</th>    \n            <th colspan="2">record</th>    \n            <th>CloudFlare status</th>    \n        </tr>    \n    </thead>\n    <tbody>\n        ';

        for (var i=0; i<records.length; i++) {
            // CNAME records
            if (records[i]['type'].match(/^(CNAME)$/)) { ;
__p += '\n                <tr id="info_row_' +
((__t = ( i )) == null ? '' : __t) +
'" class="dt_info_row">    \n                    ';
 print(CFT['zone_record']({type: "CNAME", rec_num: i, record: records[i]})) ;
__p += '\n                </tr>    \n            \n                <tr id="module_row_' +
((__t = ( i )) == null ? '' : __t) +
'" class="dt_module_row">\n                    <td colspan="7">    \n                        <div id="dnszone_table_edit_div_' +
((__t = ( i )) == null ? '' : __t) +
'" class="dt_module"></div>    \n                        <div id="dnszone_table_delete_div_' +
((__t = ( i )) == null ? '' : __t) +
'" class="dt_module"></div>    \n                        <div id="status_bar_' +
((__t = ( i )) == null ? '' : __t) +
'" class="cjt_status_bar"></div>    \n                    </td>\n                </tr>    \n            ';
 }
        }

        for (var i=0; i<records.length; i++) {
            // A, records
            if (records[i]['type'].match(/^(A)$/)) { ;
__p += '\n\n                <tr id="info_row_a_' +
((__t = ( i )) == null ? '' : __t) +
'" class="dt_info_row">    \n                    <td id="name_value_a_' +
((__t = ( i )) == null ? '' : __t) +
'">' +
((__t = ( records[i]['type'] )) == null ? '' : __t) +
'</td>    \n                    <td id="type_value_a_' +
((__t = ( i )) == null ? '' : __t) +
'">';
 print(records[i]['name'].substring(0, records[i]['name'].length - 1)) ;
__p += '</td>    \n                \n                    ';
 // A
                    if (records[i]['type'] == 'A') { ;
__p += '\n                        <td colspan="2" id="value_value_hehe_a_' +
((__t = ( i )) == null ? '' : __t) +
'">' +
((__t = ( records[i]['address'] )) == null ? '' : __t) +
'</td>    \n                    ';
 } ;
__p += ' \n\n                    <td>    \n                        <a href="javascript:void(0);" class="btn" onclick="CloudFlare.show_a_help(' +
((__t = ( i )) == null ? '' : __t) +
',\'' +
((__t = ( records[i]['name'] )) == null ? '' : __t) +
' \')">Run on CloudFlare</a>    \n                    </td>    \n                </tr>    \n\n                <tr id="module_row_a_' +
((__t = ( i )) == null ? '' : __t) +
'" class="dt_module_row">\n                    <td colspan="7">    \n                    </td>\n                </tr>    \n            ';
 }
        } ;
__p += '\n    </tbody>\n</table>\n';

}
return __p
};