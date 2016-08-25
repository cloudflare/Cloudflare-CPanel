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

    /*
     * PATCH /plugin/:id/settings/default_settings
     */
    public function applyDefaultSettings()
    {
        // Do nothing
    }
}
