<?php

namespace CF\API\Test;

use CF\API\Host;
use CF\API\Request;
use CF\Cpanel\CpanelIntegration;

class HostTest extends \PHPUnit_Framework_TestCase
{
    private $hostAPI;
    private $mockConfig;
    private $mockCpanelAPI;
    private $mockDataStore;
    private $mockLogger;
    private $mockCpanelIntegration;

    public function setup()
    {
        $this->mockConfig = $this->getMockBuilder('CF\Integration\DefaultConfig')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelAPI= $this->getMockBuilder('CF\Cpanel\CpanelAPI')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder('CF\Cpanel\DataStore')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder('CF\Integration\DefaultLogger')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelIntegration = new CpanelIntegration($this->mockConfig, $this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);

        $this->hostAPI = new Host($this->mockCpanelIntegration);


    }

    public function testBeforeSendSetsCorrectPath()
    {
        $request = new Request(null, null, null, null);
        $request = $this->hostAPI->beforeSend($request);

        $this->assertEquals(Host::ENDPOINT_PATH, $request->getUrl());
    }

    public function testBeforeSendSetsIntegrationHeaders() {
        $integrationName = "integrationName";
        $version = "version";

        $this->mockConfig->method('getValue')->will(
            $this->returnValueMap(
                array(
                    array($integrationName, $integrationName),
                    array($version, $version)
                )
        ));

        $request = new Request(null, null, null, null);
        $request = $this->hostAPI->beforeSend($request);

        $requestHeaders = $request->getHeaders();

        $this->assertEquals($integrationName, $requestHeaders[Host::CF_INTEGRATION_HEADER]);
        $this->assertEquals($version, $requestHeaders[Host::CF_INTEGRTATION_VERSION_HEADER]);
    }

    public function testBeforeSendSetsUserKeyforActZoneSet() {
        $userKey = "userKey";
        $this->mockDataStore->method('getHostAPIUserKey')->willReturn($userKey);

        $request = new Request(null, null, null, array('act' => 'zone_set'));
        $request = $this->hostAPI->beforeSend($request);

        $requestBody = $request->getBody();

        $this->assertEquals($userKey, $requestBody['user_key']);

    }

    public function testBeforeSendSetsUserKeyforActFullZoneSet() {
        $userKey = "userKey";
        $this->mockDataStore->method('getHostAPIUserKey')->willReturn($userKey);

        $request = new Request(null, null, null, array('act' => 'full_zone_set'));
        $request = $this->hostAPI->beforeSend($request);

        $requestBody = $request->getBody();

        $this->assertEquals($userKey, $requestBody['user_key']);

    }

    public function testBeforeSendSetsHostKey() {
        $hostKey = "hostKey";
        $this->mockCpanelAPI->method('getHostAPIKey')->willReturn($hostKey);

        $request = new Request(null, null, null, null);
        $request = $this->hostAPI->beforeSend($request);

        $requestBody = $request->getBody();

        $this->assertEquals($hostKey, $requestBody['host_key']);

    }

    public function testResponseOkReturnsTrueForValidResponse()
    {
        $hostAPIResponse = array(
            'result' => 'success'
        );

        $this->assertTrue($this->hostAPI->responseOk($hostAPIResponse));
    }

    public function testClientApiErrorReturnsValidStructure()
    {
        $message = "message";

        $errorResponse = $this->hostAPI->createAPIError($message);

        $this->assertEquals($message, $errorResponse["msg"]);
        $this->assertEquals("error", $errorResponse["result"]);
    }
}