<?php
require_once 'cloudflare/vendor/autoload.php';
require_once '/usr/local/cpanel/php/cpanel.php';
$cpanel = new CPANEL();

$config = new CF\Integration\DefaultConfig(file_get_contents('config.js'));
$logger = new CF\Integration\DefaultLogger($config->getValue('debug'));
$cpanelAPI = new CF\Cpanel\CpanelAPI($cpanel, $logger);
$dataStore = new CF\Cpanel\DataStore($cpanelAPI, $logger);

/*
 * 20160427 We should remove this after 6.0 has been in the wild long enough
 * to convert most people's YAML files.  No reason to support both formats indefinitely.
 */
$uniqueId = $dataStore->getDeprecatedHostUserUniqueID();
if ($uniqueId) {
    $cpanelIntegration = new CF\Cpanel\CpanelIntegration($config, $cpanelAPI, $dataStore, $logger);
    $hostAPIClient = new CF\API\Host($cpanelIntegration);
    $request = new \CF\API\Request('POST', '', null, array('act' => 'user_lookup', 'unique_id' => $uniqueId));
    $response = $hostAPIClient->callAPI($request);
    if ($hostAPIClient->responseOk($response)) {
        $response = $response['response'];
        $dataStore->createUserDataStore($response['user_api_key'], $response['cloudflare_email'], $response['unique_id'], $response['user_key']);
    } else {
        $logger->error("Failed to convert the YAML file for user '" . $cpanelAPI->getUserId() . "'");
    }
}

$stylesheetsAndMetaTags = '
    <meta http-equiv="cache-control" content="max-age=0" />
    <meta http-equiv="cache-control" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
    <meta http-equiv="pragma" content="no-cache" />
    <link rel="stylesheet" href="./stylesheets/cf.core.css" media="screen,projection" charset="utf-8"/>
    <link rel="stylesheet" href="./stylesheets/components.css" media="screen,projection" charset="utf-8"/>
    <link rel="stylesheet" href="./stylesheets/hacks.css" media="screen,projection" charset="utf-8"/>';

//add our custom styles before the </head> ¯\_(ツ)_/¯
$cpanelHeader = str_replace('</head>', $stylesheetsAndMetaTags . '</head>', $cpanel->header('Cloudflare'));
echo $cpanelHeader;
?>
<script>
cfCSRFToken = '<?=\CF\SecurityUtil::csrfTokenGenerate($cpanelAPI->getHostAPIKey(), $cpanelAPI->getUserId());?>';
localStorage.cfEmail = '<?=$dataStore->getCloudFlareEmail();?>';
/*
 * A callback for cf-util-http to proxy all calls to our backend
 *
 * @param {Object} [opts]
 * @param {String} [opts.method] - GET/POST/PUT/PATCH/DELETE
 * @param {String} [opts.url]
 * @param {Object} [opts.parameters]
 * @param {Object} [opts.headers]
 * @param {Object} [opts.body]
 * @param {Function} [opts.onSuccess]
 * @param {Function} [opts.onError]
 */
function RestProxyCallback(opts) {
    //only proxy external REST calls
    if(opts.url.lastIndexOf("http", 0) === 0) {
        if(opts.method.toUpperCase() !== "GET") {
            if(!opts.body) {
                opts.body = {};
            }
            opts.body['cfCSRFToken'] = cfCSRFToken;
            opts.body['proxyURL'] = opts.url;
        } else {
            if(!opts.parameters) {
                opts.parameters = {};
            }
            opts.parameters['proxyURL'] = opts.url;
        }

        opts.url = "./proxy.live.php";
    }
}
</script>
<div id="root" class="cloudflare-partners site-wrapper"></div>
<script src="compiled.js"></script>
<?php
$cpanel->footer();
$cpanel->end();
?>