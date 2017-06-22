<?php

namespace CF\Cpanel\Test;

use CF\Cpanel\DataStore;

class DataStoreTest extends \PHPUnit_Framework_TestCase
{
    private $mockCpanelAPI;
    private $mockLogger;
    private $dataStore;

    public function setup()
    {
        $this->mockCpanelAPI = $this->getMockBuilder('CF\Cpanel\CpanelAPI')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelAPI->method('loadFile')->willReturn(array());
        $this->mockCpanelAPI->method('saveFile')->willReturn(true);

        $this->mockLogger = $this->getMockBuilder('CF\Integration\DefaultLogger')
            ->disableOriginalConstructor()
            ->getMock();
        $this->dataStore = new DataStore($this->mockCpanelAPI, $this->mockLogger);
    }

    public function testGetDeprecatedHostUserUniqueIDReturnsValidData()
    {
        $clientAPIKey = "clientAPIKey";
        $this->dataStore->createUserDataStore($clientAPIKey, null, null, null);
        $this->assertEquals($this->dataStore->getClientV4APIKey(), $clientAPIKey);
    }

    public function testGetCloudFlareEmailReturnsValidData()
    {
        $email = "email";
        $this->dataStore->createUserDataStore(null, $email, null, null);
        $this->assertEquals($this->dataStore->getCloudFlareEmail(), $email);
    }

    public function testGetHostAPIUserUniqueIdReturnsValidData()
    {
        $uniqueId = "uniqueId";
        $this->dataStore->createUserDataStore(null, null, $uniqueId, null);
        $this->assertEquals($this->dataStore->getHostAPIUserUniqueId(), $uniqueId);
    }

    public function testGetHostAPIUserKeyReturnsValidData()
    {
        $hostUserKey = "hostUserKey";
        $this->dataStore->createUserDataStore(null, null, null, $hostUserKey);
        $this->assertEquals($this->dataStore->getHostAPIUserKey(), $hostUserKey);
    }
}
