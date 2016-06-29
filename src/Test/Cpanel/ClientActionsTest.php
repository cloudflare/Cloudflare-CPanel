<?php

namespace CF\Cpanel\Test;

use CF\API\Request;
use CF\Cpanel\ClientActions;
use CF\Cpanel\CpanelDNSRecord;
use CF\Cpanel\CpanelIntegration;

class ClientActionsTest extends \PHPUnit_Framework_TestCase
{
    private $mockClientAPI;
    private $mockConfig;
    private $mockCpanelAPI;
    private $mockDataStore;
    private $mockLogger;
    private $mockPartialZoneSet;
    private $mockCpanelIntegration;

    public function setup()
    {
        $this->mockClientAPI = $this->getMockBuilder('CF\API\Client')
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

    public function testMergeCpanelAndCFDomainsMergesCpanelMainDomains() {
        $mainDomain = "testmain.com";
        $addonDomain = array("testaddon.com");
        $parkedDomain = array("testparked.com");
        $subDomain = array("testsub.com");
        $status = 'inactive';
        $request = new Request(null, null, null, null);

        $clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $request);
        $this->mockCpanelAPI->method('getDomainList')->willReturn(
            array(
                'main_domain' => $mainDomain,
                'addon_domains' => $addonDomain,
                'parked_domains' => $parkedDomain,
                'sub_domains' => $subDomain
            )
        );
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockClientAPI->method('callAPI')->willReturn(array("result" => array()));
        $response = $clientActions->mergeCpanelAndCFDomains();

        $this->assertEquals($mainDomain, $response["result"][0]["name"]);
        $this->assertEquals($addonDomain[0], $response["result"][1]["name"]);
        $this->assertEquals($parkedDomain[0], $response["result"][2]["name"]);
        $this->assertEquals(3, count($response["result"]));
        $this->assertEquals($status, $response['result'][0]['status']);
        $this->assertEquals($status, $response['result'][1]['status']);
        $this->assertEquals($status, $response['result'][2]['status']);
    }

    public function testMergeCpanelAndCFDomainsMergesCpanelMainDomainsWithEmptyDomain() {
        $mainDomain = "testmain.com";
        $status = 'inactive';
        $addonDomain = array();
        $parkedDomain = array();
        $subDomain = array();
        $request = new Request(null, null, null, null);

        $clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $request);
        $this->mockCpanelAPI->method('getDomainList')->willReturn(
            array(
                'main_domain' => $mainDomain,
                'addon_domains' => $addonDomain,
                'parked_domains' => $parkedDomain,
                'sub_domains' => $subDomain
        $this->assertEquals($status, $response['result'][0]['status']);
    public function testMergeCpanelAndCFDomainsWithCallAPIMocked()
    {
        $mainDomain = 'testmain.com';
        $status = 'active';
        $request = new Request(null, null, null, null);

        $clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $request);
        $this->mockCpanelAPI->method('getDomainList')->willReturn(
            array(
                'main_domain' => $mainDomain,
            )
        );
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockClientAPI->method('callAPI')->willReturn(
            array(
                'success' => true,
                'result' => array(
                    array(
                        'name' => $mainDomain,
                        'status' => $status,
                    ),
                ),
            )
        );
        $response = $clientActions->mergeCpanelAndCFDomains();

        $this->assertEquals($mainDomain, $response['result'][0]['name']);
        $this->assertEquals($status, $response['result'][0]['status']);
        $this->assertEquals(1, count($response['result']));
    }

    public function testCreateDNSRecordReturnsErrorIfPartialZoneSetFails() {
        $error = "error";
        $request = new Request(null, null, null, null);

        $clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $request);
        $clientActions->setPartialZoneSet($this->mockPartialZoneSet);
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockPartialZoneSet->method('getResolveToDNSRecord')->willReturn(true);
        $this->mockPartialZoneSet->method('partialZoneSet')->willReturn(false);
        $this->mockClientAPI->method('createAPIError')->willReturn($error);

        $response = $clientActions->createDNSRecord();
        $this->assertEquals($error, $response);
    }

    public function testDeleteZoneReturnsErrorIfRemovePartialZoneSetFails() {
        $error = "error";
        $request = new Request(null, "zones/:id", null, null);

        $clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $request);
        $clientActions->setPartialZoneSet($this->mockPartialZoneSet);
        $this->mockClientAPI->method('zoneGetDetails')->willReturn(
            array(
                "result" => array(
                    "name" => "test.com"
                )
            )
        );
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockPartialZoneSet->method('getResolveToDNSRecord')->willReturn(true);
        $this->mockPartialZoneSet->method('removePartialZoneSet')->willReturn(false);
        $this->mockClientAPI->method('createAPIError')->willReturn($error);

        $response = $clientActions->deleteZone();
        $this->assertEquals($error, $response);
    }

    public function testMergeDNSRecordsReturnsMergesCNAMERecord() {
        $cname = "cname";
        $name = "test.com";
        $cpanelDNSRecord = new CpanelDNSRecord();
        $cpanelDNSRecord->setType($cname);
        $cpanelDNSRecord->setName($name);

        $request = new Request(null, "zones/:id", null, null);

        $clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $request);
        $this->mockClientAPI->method('callAPI')->willReturn(array("result" => array()));
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockCpanelAPI->method('uapi_response_ok')->willReturn(true);
        $this->mockCpanelAPI->method('getDNSRecords')->willReturn(array($cpanelDNSRecord));

        $response = $clientActions->mergeDNSRecords();

        $this->assertEquals($cname, $response["result"][0]["type"]);
    }
}