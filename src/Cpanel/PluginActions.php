<?php

namespace CF\Cpanel;

use CF\API\AbstractPluginActions;

class PluginActions extends AbstractPluginActions
{
    protected $api;
    protected $config;
    protected $clientAPI;
    protected $integrationAPI;
    protected $dataStore;
    protected $logger;
    protected $request;
    protected $userConfig;
    protected $composer;

    public static $CONFIG = array(
        'debug' => false,
        'featureManagerIsFullZoneProvisioningEnabled' => true,
        'isDNSPageEnabled' => true,
        'useHostAPILogin' => true,
        'homePageCards' => array(
            'AlwaysOnlineCard',
            'IPV6Card',
            'CacheLevelCard',
            'RailgunCard',
            'PurgeCacheCard',
        ),
        'moreSettingsCards' => array(
            'container.moresettings.security' => array(
                'SecurityLevelCard',
                'ChallengePassageCard',
                'BrowserIntegrityCheckCard',
            ),
            'container.moresettings.speed' => array(
                'MinifyCard',
                'DevelopmentModeCard',
                'BrowserCacheTTLCard',
            ),
        ),
        'locale' => 'en',
        'integrationName' => 'cpanel',
    );

    /*
     * PATCH /plugin/:id/settings/default_settings
     */
    public function applyDefaultSettings()
    {
        // Do nothing
    }

    public function getConfig()
    {
        $this->getUserConfig();
        $this->getComposerJson();

        //Clone the config to manipulate
        $config = array_merge(array(), self::$CONFIG);

        $config['version'] = $this->composer['version'];

        // Merge and intersect arrays and return responses
        $response = array_intersect_key($this->userConfig + $config, $config);

        return $this->api->createAPISuccessResponse($response);
    }

    public function getUserConfig()
    {
        if ($this->userConfig === null) {
            //Need to suppress the File not found error with @
            $userConfigContent = @file_get_contents('./config.json');

            //Need to set an empty array for merge into config
            $this->userConfig = [];
            //If we did find a config decode it
            if ($userConfigContent) {
                $this->userConfig = json_decode($userConfigContent, true);
            }
        }
    }

    public function setUserConfig($userConfig)
    {
        $this->userConfig = $userConfig;
    }

    public function getComposerJson()
    {
        if ($this->composer === null) {
            $this->composer = json_decode(file_get_contents('./composer.json'), true);
        }
    }

    public function setComposerJson($composer)
    {
        $this->composer = $composer;
    }
}
