<?php
require_once("cloudflare/vendor/autoload.php");
require_once("/usr/local/cpanel/php/cpanel.php");
session_start();
header('Content-Type: application/json');

/*
 * The Cpanel UAPI must be instantiated once and only once from a *.live.php file.  After its instantiated we can pass
 * it around to non *.live.php files and we wrap it to try to contain the cpanel specific logic from the rest of the
 * application.
 */
$cpanel = new CPANEL();
$config = new CF\Integration\DefaultConfig(file_get_contents("config.js"));
$logger = new CF\Integration\DefaultLogger($config->getValue("debug"));
$cpanelAPI = new CF\Cpanel\CpanelAPI($cpanel, $logger);
$dataStore = new CF\Cpanel\DataStore($cpanelAPI, $logger);
$cpanelIntegration = new CF\Cpanel\CpanelIntegration($config, $cpanelAPI, $dataStore, $logger);
$partialZoneSet = new \CF\Cpanel\Zone\Partial($cpanelAPI, $dataStore, $logger);
$clientAPIClient = new CF\API\Client($cpanelIntegration);
$clientAPIClientRoutes = \CF\Cpanel\ClientV4APIRoutes::$routes;
$hostAPIClient = new CF\API\Host($cpanelIntegration);
$hostAPIClientRoutes = \CF\Cpanel\HostRoutes::$routes;

$method = $_SERVER['REQUEST_METHOD'];
$parameters = $_GET;
$body = json_decode(file_get_contents('php://input'),true);
$path = (strtoupper($method === "GET") ? $_GET['proxyURL'] : $body['proxyURL']);

unset($parameters['proxyURL']);
unset($body['proxyURL']);
$request = new \CF\API\Request($method, $path, $parameters, $body);

//only check CSRF if its not a GET request
$isCSRFTokenValid = (($request->getMethod() === "GET") ? true : \CF\SecurityUtil::csrfTokenValidate($cpanelAPI->getHostAPIKey(), $cpanelAPI->getUserId(), $request->getBody()['cfCSRFToken']));
unset($body['cfCSRFToken']);
$apiResponse = "";
$apiRouter;

if(isHostAPI($request->getUrl())) {
    $apiRouter = new CF\Router\HostAPIRouter($cpanelIntegration, $hostAPIClient, $hostAPIClientRoutes);
} else if(isClientAPI($request->getUrl())) {
    $apiRouter = new CF\Router\DefaultRestAPIRouter($cpanelIntegration, $clientAPIClient, $clientAPIClientRoutes);
}
if($isCSRFTokenValid) {
    $apiResponse = $apiRouter->route($request);
} else {
    $apiResponse = $apiRouter->getAPIClient()->createAPIError("CSRF Token not valid.");
}

echo json_encode($apiResponse);

$cpanel->end();

/**
 * @param $path
 * @return bool
 */
function isClientAPI($path) {
    return (strpos($path, \CF\API\Client::ENDPOINT) !== false);
}

/**
 * @param $path
 * @return bool
 */
function isHostAPI($path) {
    return ($path === \CF\API\Host::ENDPOINT);
}
