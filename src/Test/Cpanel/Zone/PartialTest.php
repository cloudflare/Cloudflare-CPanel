<?php

namespace CF\Cpanel\Zone\Test;

use CF\Cpanel\Zone\Partial;
use CF\DNSRecord;

class PartialTest extends \PHPUnit_Framework_TestCase
{
    private $mockCpanelAPI;
    private $mockDataStore;
    private $mockLogger;
    private $partialZoneSet;

    public function setup()
    {
        $this->mockCpanelAPI = $this->getMockBuilder('CF\Cpanel\CpanelAPI')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder('CF\Cpanel\DataStore')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder('CF\Integration\DefaultLogger')
            ->disableOriginalConstructor()
            ->getMock();

        $this->partialZoneSet = new Partial($this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);
    }

    public function testPartialZoneSetWillReturnFalseIfDNSRecordListIsNull()
    {
        $this->mockCpanelAPI->method('get_dns_records')->willReturn(null);
        $this->assertFalse($this->partialZoneSet->partialZoneSet("sub domain", "domain"));
    }

    public function testPartialZoneSetWillReturnFalseIfSubDomainDNSRecordIsNull()
    {
        $this->mockCpanelAPI->method('get_dns_records')->willReturn($this->returnValue(array()));
        $this->assertFalse($this->partialZoneSet->partialZoneSet("sub domain", "domain"));
    }

    public function testRemovePartialZoneSetWillReturnFalseIfDNSRecordListIsNull()
    {
        $this->mockCpanelAPI->method('get_dns_records')->willReturn(null);
        $this->assertFalse($this->partialZoneSet->removePartialZoneSet("domain"));
    }

    public function testRemovePartialZoneSetWillReturnTrueIfResolveToDNSRecordIsNull()
    {
        $this->mockCpanelAPI->method('getDNSRecords')->willReturn($this->returnValue(array()));
        $this->assertTrue($this->partialZoneSet->removePartialZoneSet("domain"));
    }

    public function testGetResolveToDNSRecordReturnsRecord()
    {

        $expectedDNSRecord = new DNSRecord();
        $expectedDNSRecord->setName("cloudflare-resolve-to.");
        $dnsRecordList = array($expectedDNSRecord);

        $this->assertEquals($expectedDNSRecord, $this->partialZoneSet->getResolveToDNSRecord($dnsRecordList));
    }

    public function testGetForwardToValue()
    {
        $this->assertEquals("subdomain.domain.com.cdn.cloudflare.net", $this->partialZoneSet->getForwardToValue("subdomain.domain.com."));
    }

    public function testGetResolveToValue()
    {
        $this->assertEquals("cloudflare-resolve-to.domain.com.", $this->partialZoneSet->getResolveToValue("domain.com"));
    }
}
