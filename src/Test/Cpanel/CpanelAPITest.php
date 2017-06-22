<?php

namespace CF\Cpanel\Test;

interface MockCpanelLiveAPI
{
    public function cpanelfeature($feature);
}

use CF\Cpanel\CpanelAPI;

/*
 * PSR2 wants interfaces in their own file - we use this interface to mock a cPanel class without a namespace.
 */
class CpanelAPITest extends \PHPUnit_Framework_TestCase
{
    private $mockCpanelLiveAPI;
    private $mockLogger;
    private $cpanelAPI;

    public function setup()
    {
        $this->mockCpanelLiveAPI = $this->getMockBuilder('CF\Cpanel\Test\MockCpanelLiveAPI')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder('CF\Integration\DefaultLogger')
            ->disableOriginalConstructor()
            ->getMock();
        $this->cpanelAPI = new CpanelAPI($this->mockCpanelLiveAPI, $this->mockLogger);
    }

    public function testIsAdvancedZoneEditEnabledReturnsTrueIfEnabled()
    {
        $this->mockCpanelLiveAPI->method('cpanelfeature')->with("zoneedit")->willReturn(1);
        $this->assertTrue($this->cpanelAPI->isAdvancedZoneEditEnabled());
    }

    public function testIsAdvancedZoneEditEnabledReturnsFalseIfDisabled()
    {
        $this->mockCpanelLiveAPI->method('cpanelfeature')->with("zoneedit")->willReturn(0);
        $this->assertFalse($this->cpanelAPI->isAdvancedZoneEditEnabled());
    }
}
