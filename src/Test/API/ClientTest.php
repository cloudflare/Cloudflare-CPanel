<?php

namespace CF\API\Test;

use CF\API\Client;
use CF\Cpanel\CpanelIntegration;

class ClientTest extends \PHPUnit_Framework_TestCase
{
    private $mockConfig;
    private $mockClientAPI;
    private $mockCpanelAPI;
    private $mockDataStore;
    private $mockLogger;
    private $mockCpanelIntegration;

    public function setup()
    {
        $this->mockConfig = $this->getMockBuilder('CF\Integration\DefaultConfig')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClientAPI = $this->getMockBuilder('CF\API\Client')
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

        $this->mockClientAPI = new Client($this->mockCpanelIntegration);
    }

    public function testClientApiErrorReturnsValidStructure()
    {
        $expectedErrorResponse = array(
            'result' => null,
            'success' => false,
            'errors' => array(
                array(
                    'code' => '',
                    'message' => 'Test Message',
                )
            ),
            'messages' => array()
        );
        $errorResponse = $this->mockClientAPI->createAPIError("Test Message");
        $this->assertEquals($errorResponse, $expectedErrorResponse);
    }

    public function testResponseOkReturnsTrueForValidResponse()
    {
        $v4APIResponse = array(
            "success" => true
        );

        $this->assertTrue($this->mockClientAPI->responseOk($v4APIResponse));
    }
}
