<?php

namespace CF\Router\Test;

use CF\API\Request;
use CF\Cpanel\CpanelIntegration;
use CF\Router\HostAPIRouter;

class HostAPIRouterTest extends \PHPUnit_Framework_TestCase
{

    private $hostAPIRouter;
    private $mockConfig;
    private $mockClientAPI;
    private $mockCpanelAPI;
    private $mockCpanelIntegration;
    private $mockDataStore;
    private $mockLogger;
    private $mockRoutes = array();

    public function setup()
    {
        $this->mockConfig = $this->getMockBuilder('CF\Integration\DefaultConfig')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClientAPI = $this->getMockBuilder('CF\API\Host')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelAPI = $this->getMockBuilder('CF\Cpanel\CpanelAPI')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder('CF\Cpanel\DataStore')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder('CF\Integration\DefaultLogger')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelIntegration = new CpanelIntegration($this->mockConfig, $this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);
        $this->hostAPIRouter = new HostAPIRouter($this->mockCpanelIntegration, $this->mockClientAPI, $this->mockRoutes);
    }

    public function testGetPathReturnsHostAPIActParameter()
    {
        $request = new Request(null, null, null, array('act' => 'testAction'));
        $path = $this->hostAPIRouter->getPath($request);
        $this->assertEquals("testAction", $path);
    }
}
