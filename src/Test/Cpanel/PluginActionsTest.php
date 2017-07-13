<?php

namespace CF\Cpanel\Test;

use CF\API\Client;
use CF\API\Request;
use CF\Cpanel\CpanelAPI;
use CF\Cpanel\DataStore;
use CF\Cpanel\PluginActions;
use CF\Integration\DefaultConfig;
use CF\Integration\DefaultIntegration;
use CF\Integration\DefaultLogger;

class PluginActionsTest extends \PHPUnit_Framework_TestCase
{
    private $mockConfig;
    private $mockLogger;
    private $mockRequest;
    private $mockClientAPI;
    private $mockCpanelAPI;
    private $mockDataStore;
    private $mockPluginActions;
    private $mockCpanelIntegration;

    public function setup()
    {
        $this->mockConfig = $this->getMockBuilder(DefaultConfig::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClientAPI = $this->getMockBuilder(Client::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelAPI = $this->getMockBuilder(CpanelAPI::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder(DataStore::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder(DefaultLogger::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockRequest = $this->getMockBuilder(Request::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->mockCpanelIntegration = new DefaultIntegration($this->mockConfig, $this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);
        $this->pluginActions = new pluginActions($this->mockCpanelIntegration, $this->mockClientAPI, $this->mockRequest);
    }

    public function testGetConfigReturnsDefaultConfig()
    {
        $version = "1.0.0";
        $composer = ['version' => $version];

        $this->pluginActions->setComposerJson($composer);
        $response = $this->pluginActions->getConfig();

        $config = array_merge(array(), pluginActions::$CONFIG);
        $config['version'] = $version;

        $this->assertEquals($config, $response);
    }

    public function testGetConfigMergesUserConfig()
    {
        $userConfig = [
            'debug' => true,
        ];
        $this->pluginActions->setUserConfig($userConfig);
        $response = $this->pluginActions->getConfig();
        $this->assertEquals(true, $response['debug']);
    }

    public function testGetConfigIgnoresInvalidKeys()
    {
        $userConfig = [
            'something' => true,
        ];
        $this->pluginActions->setUserConfig($userConfig);
        $response = $this->pluginActions->getConfig();
        $this->assertArrayNotHasKey('something', $response);
    }
}
