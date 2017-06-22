<?php

namespace CF\Cpanel;

use CF\API\APIInterface;
use CF\API\Request;
use CF\Cpanel\Zone\Partial;
use CF\SecurityUtil;
use CF\Integration\DefaultIntegration;

class HostActions
{
    private $api;
    private $config;
    private $cpanelAPI;
    private $dataStore;
    private $logger;
    private $partialZoneSet;
    private $request;

    /**
     * @param DefaultIntegration $cpanelIntegration
     * @param APIInterface       $api
     * @param Request            $request
     */
    public function __construct(DefaultIntegration $cpanelIntegration, APIInterface $api, Request $request)
    {
        $this->api = $api;
        $this->config = $cpanelIntegration->getConfig();
        $this->cpanelAPI = $cpanelIntegration->getIntegrationAPI();
        $this->dataStore = $cpanelIntegration->getDataStore();
        $this->logger = $cpanelIntegration->getLogger();
        $this->partialZoneSet = new Partial($this->cpanelAPI, $this->dataStore, $this->logger);
        $this->request = $request;
    }

    /**
     * @param Partial $partialZoneSet
     */
    public function setPartialZoneSet(Partial $partialZoneSet)
    {
        $this->partialZoneSet = $partialZoneSet;
    }

    /**
     * ?act=zone_set.
     *
     * @return string
     */
    public function partialZoneSet()
    {
        if (!$this->cpanelAPI->isAdvancedZoneEditEnabled()) {
            return $this->api->createAPIError(Partial::ADVANCED_ZONE_EDIT_DISABLED_ERROR);
        }
        $bodyParameters = $this->request->getBody();
        if (isset($bodyParameters['zone_name'])) {
            if ($this->partialZoneSet->partialZoneSet('www.'.$bodyParameters['zone_name'].'.', $bodyParameters['zone_name'])) {
                $bodyParameters['subdomains'] = 'www';
                //remove trailing . get_resolve_to_value() adds to the end cause Host API doesn't want it.
                $bodyParameters['resolve_to'] = rtrim($this->partialZoneSet->getResolveToValue($bodyParameters['zone_name']), '.');
                $this->request->setBody($bodyParameters);

                return $this->api->callAPI($this->request);
            } else {
                return $this->api->createAPIError("Cpanel was unable to provision '".$bodyParameters['zone_name']."' please contact your hosting provider.");
            }
        } else {
            return $this->api->createAPIError("Missing parameter 'zone_name'.");
        }
    }

    /**
     * ?act=user_create.
     *
     * @return string
     */
    public function userCreate()
    {
        $uniqueId = SecurityUtil::generate16bytesOfSecureRandomData();
        //if generate16BytesOfSecureRandomData fails fall back to md5
        if ($uniqueId === false) {
            $this->logger->warn('SecurityUtil::generate16bytesOfSecureRandomData failed.');
            $uniqueId = md5($this->request->getBody()['cloudflare_email'].time().$this->cpanelAPI->getUserId().$this->cpanelAPI->getHomeDir().$this->cpanelAPI->getHostAPIKey());
        }
        $parameters['body']['unique_id'] = $uniqueId;

        $userCreateResponse = $this->api->callAPI($this->request);

        if ($this->api->responseOk($userCreateResponse)) {
            $userApiKey = $userCreateResponse['response']['user_api_key'];
            $cloudflareEmail = $userCreateResponse['response']['cloudflare_email'];
            $uniqueId = $userCreateResponse['response']['unique_id'];
            $userKey = $userCreateResponse['response']['user_key'];

            $this->dataStore->createUserDataStore($userApiKey, $cloudflareEmail, $uniqueId, $userKey);
        }

        return $userCreateResponse;
    }

    /**
     * ?act=user_auth.
     *
     * @return string
     */
    public function userAuth()
    {
        $userAuthResponse = $this->api->callAPI($this->request);

        if ($this->api->responseOk($userAuthResponse)) {
            $userApiKey = $userAuthResponse['response']['user_api_key'];
            $cloudflareEmail = $userAuthResponse['response']['cloudflare_email'];
            $uniqueId = $userAuthResponse['response']['unique_id'];
            $userKey = $userAuthResponse['response']['user_key'];

            $this->dataStore->createUserDataStore($userApiKey, $cloudflareEmail, $uniqueId, $userKey);
        }

        return $userAuthResponse;
    }
}
