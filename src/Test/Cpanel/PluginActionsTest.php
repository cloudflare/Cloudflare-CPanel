<?php

namespace CF\Cpanel\Test;

use CF\API\Plugin;
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
    private $mockCpanelAPI;
    private $mockPluginAPI;
    private $mockDataStore;
    private $mockCpanelIntegration;

    public function setup()
    {
        $this->mockConfig = $this->getMockBuilder(DefaultConfig::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockPluginAPI = $this->getMockBuilder(Plugin::class)
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
        $this->pluginActions = new pluginActions($this->mockCpanelIntegration, $this->mockPluginAPI, $this->mockRequest);
    }

    public function testGetConfigReturnsDefaultConfig()
    {
        $version = "1.0.0";
        $composer = ['version' => $version];

        $this->pluginActions->setComposerJson($composer);
        $config = array(
            'success' => true,
            'result' => pluginActions::$CONFIG,
            'messages' => array(),
            'errors' => array(),
        );
        $config['version'] = $version;

        $this->mockPluginAPI->method('createAPISuccessResponse')->willReturn($config);
        $response = $this->pluginActions->getConfig();
        $this->assertEquals($config, $response);
    }

    public function testGetConfigMergesUserConfig()
    {
        $userConfig = [
            'debug' => true,
        ];
        $this->pluginActions->setUserConfig($userConfig);
        $this->mockPluginAPI->method('createAPISuccessResponse')->will($this->returnCallback(function ($config) {
            return $config;
        }));

        $response = $this->pluginActions->getConfig();
        $this->assertTrue($response['debug']);
    }

    public function testGetConfigIgnoresInvalidKeys()
    {

        $userConfig = [
            'something' => true,
        ];
        $this->pluginActions->setUserConfig($userConfig);
        $this->mockPluginAPI->method('createAPISuccessResponse')->will($this->returnCallback(function ($config) {
            return $config;
        }));

        $response = $this->pluginActions->getConfig();
        $this->assertArrayNotHasKey('something', $response);
    }
}
