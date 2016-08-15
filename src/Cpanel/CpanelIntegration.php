<?php

namespace CF\Cpanel;

use CF\Integration\ConfigInterface;
use CF\Integration\DataStoreInterface;
use CF\Integration\IntegrationAPIInterface;
use CF\Integration\IntegrationInterface;
use Psr\Log\LoggerInterface;

class CpanelIntegration implements IntegrationInterface
{
    private $config;
    private $cpanelAPI;
    private $dataStore;
    private $logger;

    /**
     * @param ConfigInterface         $config
     * @param CpanelAPI               $cpanelAPI
     * @param DataStoreInterface      $dataStore
     * @param Psr\Log\LoggerInterface $logger
     */
    public function __construct(ConfigInterface $config, CpanelAPI $cpanelAPI, DataStoreInterface $dataStore, LoggerInterface $logger)
    {
        $this->config = $config;
        $this->cpanelAPI = $cpanelAPI;
        $this->dataStore = $dataStore;
        $this->logger = $logger;
    }

    /**
     * @return ConfigInterface
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * @param ConfigInterface $config
     */
    public function setConfig(ConfigInterface $config)
    {
        $this->config = $config;
    }

    /**
     * @return CpanelAPI
     */
    public function getIntegrationAPI()
    {
        return $this->cpanelAPI;
    }

    /**
     * @param IntegrationAPIInterface $integrationAPI
     */
    public function setIntegrationAPI(IntegrationAPIInterface $integrationAPI)
    {
        $this->cpanelAPI = $integrationAPI;
    }

    /**
     * @return DataStore
     */
    public function getDataStore()
    {
        return $this->dataStore;
    }

    /**
     * @param DataStoreInterface $dataStore
     */
    public function setDataStore(DataStoreInterface $dataStore)
    {
        $this->dataStore = $dataStore;
    }

    /**
     * @return LoggerInterface
     */
    public function getLogger()
    {
        return $this->logger;
    }

    /**
     * @param LoggerInterface $logger
     */
    public function setLogger(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }
}
