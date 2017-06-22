<?php

namespace CF\Cpanel;

use CF\Integration\DefaultLogger;
use Symfony\Component\Yaml\Yaml as Yaml;
use CF\Integration\DataStoreInterface;

class DataStore implements DataStoreInterface
{
    private $cpanel;
    private $username;
    private $homeDir;
    private $yamlData;

    const PATH_TO_YAML_FILE = '/.cpanel/datastore';
    const YAML_FILE_NAME = 'cloudflare_data.yaml';

    const CLIENT_API_KEY = 'client_api_key';
    const EMAIL_KEY = 'cloudflare_email';
    const HOST_USER_UNIQUE_ID_KEY = 'host_user_unique_id';
    const HOST_USER_KEY = 'host_user_key';

    //deprectated yaml file keys
    const DEPRECATED_HOST_USER_UNIQUE_ID_KEY = 'cf_user_tokens';

    /**
     * @param CpanelAPI     $cpanel
     * @param DefaultLogger $logger
     */
    public function __construct(CpanelAPI $cpanel, DefaultLogger $logger)
    {
        $this->cpanel = $cpanel;
        $this->logger = $logger;
        $this->username = $this->cpanel->getUserId();
        $this->homeDir = $this->cpanel->getHomeDir();
        $this->yamlData = $this->loadYAMLFile();
    }

    /*
     * 20160127 callHostUserLookup() and convert_deprecated_yaml_file() exist to convert the old file structure to the new one specified in
     * createUserDataStore().  Eventually we need to remove the function below and its use in index.live.php.
     */
    /**
     * @return mixed
     */
    public function getDeprecatedHostUserUniqueID()
    {
        $deprectatedHostKey = $this->get(self::DEPRECATED_HOST_USER_UNIQUE_ID_KEY);
        if (isset($deprectatedHostKey)) {
            return $deprectatedHostKey[$this->username];
        }

        return false;
    }

    /**
     * @return array
     */
    private function loadYAMLFile()
    {
        $getFileContent = $this->cpanel->loadFile($this->homeDir.self::PATH_TO_YAML_FILE, self::YAML_FILE_NAME);
        if ($this->cpanel->uapiResponseOk($getFileContent)) {
            return Yaml::parse($getFileContent['content']);
        } else {
            $this->logger->error(self::PATH_TO_YAML_FILE.self::YAML_FILE_NAME.' does not exist.');
        }

        return false;
    }

    /**
     * @return bool
     */
    private function saveYAMLFile()
    {
        $fileContents = Yaml::dump($this->yamlData);
        $result = $this->cpanel->saveFile($this->homeDir.self::PATH_TO_YAML_FILE, self::YAML_FILE_NAME, $fileContents);

        return $this->cpanel->uapiResponseOk($result);
    }

    /**
     * @param $clientApiKey
     * @param $email
     * @param $uniqueId
     * @param $userKey
     */
    public function createUserDataStore($clientApiKey, $email, $uniqueId, $userKey)
    {
        $this->yamlData = array(
            self::CLIENT_API_KEY => $clientApiKey,
            self::EMAIL_KEY => $email,
            self::HOST_USER_UNIQUE_ID_KEY => $uniqueId,
            self::HOST_USER_KEY => $userKey,
        );

        $this->saveYAMLFile();
    }

    /**
     * @return unique id for the current user for use in the host api
     */
    public function getHostAPIUserUniqueId()
    {
        return $this->get(self::HOST_USER_UNIQUE_ID_KEY);
    }

    /**
     * @return client v4 api key for current user
     */
    public function getClientV4APIKey()
    {
        return $this->get(self::CLIENT_API_KEY);
    }

    /**
     * @return mixed
     */
    public function getHostAPIUserKey()
    {
        return $this->get(self::HOST_USER_KEY);
    }

    /**
     * @return cloudflare email
     */
    public function getCloudFlareEmail()
    {
        return $this->get(self::EMAIL_KEY);
    }

    /**
     * @param $key
     *
     * @return mixed
     */
    public function get($key)
    {
        return $this->yamlData[$key];
    }

    /**
     * @param $key
     * @param $value
     *
     * @return mixed
     */
    public function set($key, $value)
    {
        if (isEmpty($this->yamlData)) {
            $this->yamlData = array();
        }

        $this->yamlData[$key] = $value;

        return $this->saveYAMLFile();
    }
}
