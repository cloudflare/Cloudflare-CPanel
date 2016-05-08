<?php

namespace CF\Cpanel\Test;

use CF\API\Request;
use CF\Cpanel\CpanelIntegration;
use CF\Cpanel\HostActions;

class HostActionsTest extends \PHPUnit_Framework_TestCase
{
    private $mockHostAPI;
    private $mockConfig;
    private $mockCpanelAPI;
    private $mockDataStore;
    private $mockLogger;
    private $mockPartialZoneSet;
    private $mockCpanelIntegration;

    public function setup()
    {
        $this->mockHostAPI = $this->getMockBuilder('CF\API\Host')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockConfig = $this->getMockBuilder('CF\Integration\DefaultConfig')
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
        $this->mockPartialZoneSet = $this->getMockBuilder('CF\Cpanel\Zone\Partial')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelIntegration = new CpanelIntegration($this->mockConfig, $this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);
    }

    public function testPartialZoneSetReturnsErrorIfItFails() {
        $error = "error";
        $request = new Request(null, null, null, array("zone_name" => "test.com"));
        $hostActions = new HostActions($this->mockCpanelIntegration, $this->mockHostAPI, $request);
        $hostActions->setPartialZoneSet($this->mockPartialZoneSet);
        $this->mockPartialZoneSet->method('partialZoneSet')->willReturn(false);
        $this->mockHostAPI->method('createAPIError')->willReturn($error);

        $response = $hostActions->partialZoneSet();

        $this->assertEquals($error, $response);
    }

    public function testUserCreateCallsDataStoreCreateUserDataStore() {
        $request = new Request(null, null, null, null);
        $hostActions = new HostActions($this->mockCpanelIntegration, $this->mockHostAPI, $request);
        $this->mockHostAPI->method('responseOk')->willReturn(true);
        $this->mockDataStore
            ->expects($this->once())
            ->method('createUserDataStore')
            ->will($this->returnValue(true));
        $hostActions->userCreate();
    }

    public function testUserAuthCallsDataStoreCreateUserDataStore() {
        $request = new Request(null, null, null, null);
        $hostActions = new HostActions($this->mockCpanelIntegration, $this->mockHostAPI, $request);
        $this->mockHostAPI->method('responseOk')->willReturn(true);
        $this->mockDataStore
            ->expects($this->once())
            ->method('createUserDataStore')
            ->will($this->returnValue(true));
        $hostActions->userAuth();
    }
}