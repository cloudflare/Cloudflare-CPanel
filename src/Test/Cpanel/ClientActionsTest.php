<?php

namespace CF\Cpanel\Test;

use CF\Cpanel\ClientActions;
use CF\Integration\DefaultIntegration;

class ClientActionsTest extends \PHPUnit_Framework_TestCase
{
    private $clientActions;
    private $mockClientAPI;
    private $mockConfig;
    private $mockCpanelAPI;
    private $mockCpanalDNSRecord;
    private $mockDataStore;
    private $mockLogger;
    private $mockPartialZoneSet;
    private $mockCpanelIntegration;
    private $mockRequest;

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
        $this->mockCpanalDNSRecord = $this->getMockBuilder('CF\Cpanel\CpanelDNSRecord')
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
        $this->mockRequest = $this->getMockBuilder('CF\API\Request')
        ->disableOriginalConstructor()
        ->getMock();
        $this->mockCpanelIntegration = new DefaultIntegration($this->mockConfig, $this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);
        $this->clientActions = new ClientActions($this->mockCpanelIntegration, $this->mockClientAPI, $this->mockRequest);
        $this->clientActions->setPartialZoneSet($this->mockPartialZoneSet);
    }

    public function testMergeCpanelAndCFDomainsMergesCpanelMainDomains()
    {
        $mainDomain = 'testmain.com';
        $status = 'inactive';
        $addonDomain = array('testaddon.com');
        $parkedDomain = array('testparked.com');
        $subDomain = array('testsub.com');

        $this->mockCpanelAPI->method('getDomainList')->willReturn(
            array(
            'main_domain' => $mainDomain,
            'addon_domains' => $addonDomain,
            'parked_domains' => $parkedDomain,
            'sub_domains' => $subDomain,
            )
        );
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockClientAPI->method('callAPI')->willReturn(array('result' => array()));
        $response = $this->clientActions->mergeCpanelAndCFDomains();

        $this->assertEquals($status, $response['result'][0]['status']);
        $this->assertEquals($mainDomain, $response['result'][0]['name']);
        $this->assertEquals($status, $response['result'][1]['status']);
        $this->assertEquals($addonDomain[0], $response['result'][1]['name']);
        $this->assertEquals($status, $response['result'][2]['status']);
        $this->assertEquals($parkedDomain[0], $response['result'][2]['name']);
        $this->assertEquals(3, count($response['result']));
    }

    public function testMergeCpanelAndCFDomainsMergesCpanelMainDomainsWithEmptyDomain()
    {
        $mainDomain = 'testmain.com';
        $status = 'inactive';
        $addonDomain = array();
        $parkedDomain = array();
        $subDomain = array();

        $this->mockCpanelAPI->method('getDomainList')->willReturn(
            array(
            'main_domain' => $mainDomain,
            'addon_domains' => $addonDomain,
            'parked_domains' => $parkedDomain,
            'sub_domains' => $subDomain,
            )
        );
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockClientAPI->method('callAPI')->willReturn(array('result' => array()));
        $response = $this->clientActions->mergeCpanelAndCFDomains();

        $this->assertEquals($mainDomain, $response['result'][0]['name']);
        $this->assertEquals($status, $response['result'][0]['status']);
        $this->assertEquals(1, count($response['result']));
    }

    public function testMergeCpanelAndCFDomainsWithCallAPIMocked()
    {
        $mainDomain = 'testmain.com';
        $status = 'active';

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
        $response = $this->clientActions->mergeCpanelAndCFDomains();

        $this->assertEquals($mainDomain, $response['result'][0]['name']);
        $this->assertEquals($status, $response['result'][0]['status']);
        $this->assertEquals(1, count($response['result']));
    }

    public function testCreateDNSRecordReturnsErrorIfPartialZoneSetFails()
    {
        $error = 'error';

        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockPartialZoneSet->method('getResolveToDNSRecord')->willReturn(true);
        $this->mockPartialZoneSet->method('partialZoneSet')->willReturn(false);
        $this->mockClientAPI->method('createAPIError')->willReturn($error);

        $response = $this->clientActions->createDNSRecord();
        $this->assertEquals($error, $response);
    }

    public function testDeleteZoneReturnsErrorIfRemovePartialZoneSetFails()
    {
        $error = 'error';

        $this->mockClientAPI->method('zoneGetDetails')->willReturn(
            array(
            'result' => array(
            'name' => 'test.com',
            ),
            )
        );
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockPartialZoneSet->method('getResolveToDNSRecord')->willReturn(true);
        $this->mockPartialZoneSet->method('removePartialZoneSet')->willReturn(false);
        $this->mockClientAPI->method('createAPIError')->willReturn($error);

        $response = $this->clientActions->deleteZone();
        $this->assertEquals($error, $response);
    }

    public function testMergeDNSRecordsReturnsMergesCNAMERecord()
    {
        $cname = 'cname';
        $name = 'test.com';

        $this->mockCpanalDNSRecord->method('getType')->willReturn($cname);
        $this->mockCpanalDNSRecord->method('getName')->willReturn($name);

        $this->mockClientAPI->method('callAPI')->willReturn(array('result' => array()));
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockCpanelAPI->method('uapi_response_ok')->willReturn(true);
        $this->mockCpanelAPI->method('getDNSRecords')->willReturn(array($this->mockCpanalDNSRecord));

        $this->mockRequest->method('getUrl')->willReturn('/zones/:id/dns_records');

        $response = $this->clientActions->mergeDNSRecords();

        $this->assertEquals($cname, $response['result'][0]['type']);
    }

    public function testMergeDNSRecordsReturnsRootDomainWhenFullProvisioned()
    {
        $type = 'A';
        $rootdomain = 'rootdomain.com';

        $this->mockPartialZoneSet->method('getResolveToDNSRecord')->willReturn(null);
        $this->mockPartialZoneSet->method('getResolveToValue')->willReturn('resolve.to.'.$rootdomain);

        $this->mockClientAPI->method('zoneGetDetails')->willReturn(
            array(
            'result' => array(
            'name' => $rootdomain,
            ),
            )
        );

        $this->mockCpanalDNSRecord->method('getType')->willReturn($type);
        $this->mockCpanalDNSRecord->method('getName')->willReturn($rootdomain.'.');

        $this->mockClientAPI->method('callAPI')->willReturn(array('result' => array()));
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockCpanelAPI->method('uapi_response_ok')->willReturn(true);
        $this->mockCpanelAPI->method('getDNSRecords')->willReturn(array($this->mockCpanalDNSRecord));

        $this->mockRequest->method('getUrl')->willReturn('/zones/:id/dns_records');

        $response = $this->clientActions->mergeDNSRecords();

        $this->assertEquals($rootdomain.'.', $response['result'][0]['name']);
    }

    public function testMergeDNSRecordsReturnsRootDomainWhenNotFullProvisioned()
    {
        $type = 'A';
        $rootdomain = 'rootdomain.com';

        $this->mockPartialZoneSet->method('getResolveToDNSRecord')->willReturn('notnull');
        $this->mockPartialZoneSet->method('getResolveToValue')->willReturn('resolve.to.'.$rootdomain);

        $this->mockClientAPI->method('zoneGetDetails')->willReturn(
            array(
            'result' => array(
            'name' => $rootdomain,
            ),
            )
        );

        $this->mockCpanalDNSRecord->method('getType')->willReturn($type);
        $this->mockCpanalDNSRecord->method('getName')->willReturn($rootdomain.'.');

        $this->mockClientAPI->method('callAPI')->willReturn(array('result' => array()));
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockCpanelAPI->method('uapi_response_ok')->willReturn(true);
        $this->mockCpanelAPI->method('getDNSRecords')->willReturn(array($this->mockCpanalDNSRecord));

        $this->mockRequest->method('getUrl')->willReturn('/zones/:id/dns_records');

        $response = $this->clientActions->mergeDNSRecords();

        $this->assertEquals(array(), $response['result']);
    }

    public function testAddSSLVerficiationDNSRecordForCNameAddsRecord()
    {
        $domain = 'domain.com';
        $zoneList = [
          [
          'id' => 'id',
          'name' => $domain,
          'type' => 'CNAME'
          ]
        ];

        $mockResponse = [
          'result' => [
            [
              'certificate_status' => 'active',
              'verification_type' => 'cname',
              'verification_info' => [
                'record_name' => 'b3b90cfedd89a3e487d3e383c56c4267.' . $domain,
                'record_target' => '6979be7e4cfc9e5c603e31df7efac9cc60fee82d.comodoca.com'
              ]
            ]
          ]
        ];

        $this->mockClientAPI->method('callAPI')->willReturn($mockResponse);
        $this->mockClientAPI->method('responseOk')->willReturn(true);
        $this->mockCpanelAPI->method('getDNSRecords')->willReturn([]);
        $this->mockCpanelAPI->method('addDNSRecord')->willReturn(true);
        $this->assertTrue($this->clientActions->addSSLVerficiationDNSRecordForCName($zoneList));
    }
}
