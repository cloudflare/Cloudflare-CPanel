<?php

namespace CF\API\Test;

class AbstractPluginActionsTest extends \PHPUnit_Framework_TestCase
{

    protected $mockAbstractPluginActions;
    protected $mockAPIClient;
    protected $mockClientAPI;
    protected $mockDataStore;
    protected $mockLogger;
    protected $mockRequest;
    protected $pluginActions;

    public function setup()
    {
        $this->mockAPIClient = $this->getMockBuilder('\CF\API\Plugin')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClientAPI = $this->getMockBuilder('\CF\API\Client')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder('\CF\Integration\DataStoreInterface')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder('\Psr\Log\LoggerInterface')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockRequest = $this->getMockBuilder('\CF\API\Request')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockAbstractPluginActions = $this->getMockBuilder('CF\API\AbstractPluginActions')
            ->disableOriginalConstructor()
            ->getMockForAbstractClass();
        $this->mockAbstractPluginActions->setRequest($this->mockRequest);
        $this->mockAbstractPluginActions->setAPI($this->mockAPIClient);
        $this->mockAbstractPluginActions->setClientAPI($this->mockClientAPI);
        $this->mockAbstractPluginActions->setDataStore($this->mockDataStore);
        $this->mockAbstractPluginActions->setLogger($this->mockLogger);

    }

    public function testPostAccountSaveAPICredentialsReturnsErrorIfMissingApiKey() {
        $this->mockRequest->method('getBody')->willReturn(array(
            'email' => 'email'
        ));
        $this->mockAPIClient->method('createAPIError')->willReturn(array('success' => false));

        $response = $this->mockAbstractPluginActions->login();

        $this->assertFalse($response['success']);
    }

    public function testPostAccountSaveAPICredentialsReturnsErrorIfMissingEmail() {
        $this->mockRequest->method('getBody')->willReturn(array(
            'apiKey' => 'apiKey'
        ));
        $this->mockAPIClient->method('createAPIError')->willReturn(array('success' => false));

        $response = $this->mockAbstractPluginActions->login();

        $this->assertFalse($response['success']);
    }

    public function testPostAccountSaveAPICredentialsReturnsDataStoreEmailIfSuccessful() {
        $email = "email";
        $this->mockRequest->method('getBody')->willReturn(array(
            'apiKey' => 'apiKey',
            $email => $email
        ));
        $this->mockAPIClient->method('createAPISuccessResponse')->willReturn(array('email' => $email));
        $this->mockAbstractPluginActions->login();
    }

    public function testGetPluginSettingsReturnsArray() {
        $this->mockAPIClient
            ->expects($this->once())
            ->method('createAPISuccessResponse')
            ->will($this->returnCallback(function($input) {
                $this->assertTrue(is_array($input));
            }));
        $this->mockAbstractPluginActions->getPluginSettings();
    }

    public function testPatchPluginSettingsReturnsErrorForBadSetting() {
        $this->mockRequest->method('getUrl')->willReturn('plugin/:id/settings/nonExistentSetting');
        $this->mockAPIClient->expects($this->once())->method('createAPIError');
        $this->mockAbstractPluginActions->patchPluginSettings();
    }
}
