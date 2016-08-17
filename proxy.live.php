<?php

require_once 'cloudflare/vendor/autoload.php';
require_once '/usr/local/cpanel/php/cpanel.php';
session_start();
header('Content-Type: application/json');

/*
 * The Cpanel UAPI must be instantiated once and only once from a *.live.php file.  After its instantiated we can pass
 * it around to non *.live.php files and we wrap it to try to contain the cpanel specific logic from the rest of the
 * application.
 */
$cpanel = new CPANEL();
$config = new CF\Integration\DefaultConfig(file_get_contents('config.js'));
$logger = new CF\Integration\DefaultLogger($config->getValue('debug'));
$cpanelAPI = new CF\Cpanel\CpanelAPI($cpanel, $logger);
$dataStore = new CF\Cpanel\DataStore($cpanelAPI, $logger);
$cpanelIntegration = new CF\Integration\DefaultIntegration($config, $cpanelAPI, $dataStore, $logger);
$partialZoneSet = new \CF\Cpanel\Zone\Partial($cpanelAPI, $dataStore, $logger);
$requestRouter = new \CF\Router\RequestRouter($cpanelIntegration);
$requestRouter->addRouter('\CF\API\Client', \CF\Cpanel\ClientV4APIRoutes::$routes);
$requestRouter->addRouter('\CF\API\Plugin', \CF\Cpanel\PluginRoutes::getRoutes(\CF\API\PluginRoutes::$routes));
$requestRouter->addRouter('\CF\API\Host', \CF\Cpanel\HostRoutes::$routes);

$method = $_SERVER['REQUEST_METHOD'];
$parameters = $_GET;
$body = json_decode(file_get_contents('php://input'), true);
$path = (strtoupper($method === 'GET') ? $_GET['proxyURL'] : $body['proxyURL']);

unset($parameters['proxyURL']);
unset($body['proxyURL']);
$request = new \CF\API\Request($method, $path, $parameters, $body);

$isCSRFTokenValid = (($request->getMethod() === 'GET') ? true : \CF\SecurityUtil::csrfTokenValidate($cpanelAPI->getHostAPIKey(), $cpanelAPI->getUserId(), $request->getBody()['cfCSRFToken']));
unset($body['cfCSRFToken']);

if ($isCSRFTokenValid) {
    $response = $requestRouter->route($request);
} else {
    $message = 'CSRF Token not valid.';
    $response = array(
        'result' => null,
        'success' => false,
        'errors' => array(
            array(
                'code' => '',
                'message' => $message,
            ),
        ),
        'messages' => array(),
    );
}

echo json_encode($response);

$cpanel->end();
