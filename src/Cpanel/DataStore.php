<?php

namespace CF\Cpanel;

use CF\Integration\DefaultLogger;
use Symfony\Component\Yaml\Yaml as Yaml;
use CF\Integration\DataStoreInterface;

class DataStore implements DataStoreInterface
{
    private $cpanel;
    private $username;
    private $home_dir;
    private $yaml_data;

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
        $this->home_dir = $this->cpanel->get_home_dir();
        $this->yaml_data = $this->loadYAMLFile();
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
        $get_file_content = $this->cpanel->load_file($this->home_dir.self::PATH_TO_YAML_FILE, self::YAML_FILE_NAME);
        if ($this->cpanel->uapi_response_ok($get_file_content)) {
            return Yaml::parse($get_file_content['content']);
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
        $file_contents = Yaml::dump($this->yaml_data);
        $result = $this->cpanel->save_file($this->home_dir.self::PATH_TO_YAML_FILE, self::YAML_FILE_NAME, $file_contents);

        return $this->cpanel->uapi_response_ok($result);
    }

    /**
     * @param $client_api_key
     * @param $email
     * @param $unique_id
     * @param $user_key
     */
    public function createUserDataStore($client_api_key, $email, $unique_id, $user_key)
    {
        $this->yaml_data = array(
            self::CLIENT_API_KEY => $client_api_key,
            self::EMAIL_KEY => $email,
            self::HOST_USER_UNIQUE_ID_KEY => $unique_id,
            self::HOST_USER_KEY => $user_key,
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
        return $this->yaml_data[$key];
    }

    /**
     * @param $key
     * @param $value
     *
     * @return mixed
     */
    public function set($key, $value)
    {
        if (isEmpty($this->yaml_data)) {
            $this->yaml_data = array();
        }

        $this->yaml_data[$key] = $value;

        return $this->saveYAMLFile();
    }
}
