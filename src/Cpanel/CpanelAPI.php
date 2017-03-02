<?php

namespace CF\Cpanel;

use CF\DNSRecord;
use CF\Integration\IntegrationAPIInterface;
use CF\Integration\DefaultLogger;

class CpanelAPI implements IntegrationAPIInterface
{
    private $cpanel_api;
    private $logger;

    const CPANEL_UAPI_NAME = 'CPANEL UAPI';
    const CPANEL_API2_NAME = 'CPANEL API2';

    /**
     * @param $cpanel_api
     * @param DefaultLogger $logger
     */
    public function __construct($cpanel_api, DefaultLogger $logger)
    {
        $this->cpanel_api = $cpanel_api;
        $this->logger = $logger;
    }

    /**
     * @param $module
     * @param $function
     * @param $parameters
     */
    private function api2($module, $function, $parameters)
    {
        $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'request', 'module' => $module, 'function' => $function, 'parameters' => $parameters), true);

        $cpanel_api2_response = $this->cpanel_api->api2($module, $function, $parameters);

        $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'response', $cpanel_api2_response), $this->api2ResponseOk($cpanel_api2_response));

        if (!$this->api2ResponseOk($cpanel_api2_response)) {
            $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'request', 'module' => $module, 'function' => $function, 'parameters' => $parameters), false);
            $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'response', 'body' => $cpanel_api2_response), false);
        }

        return $cpanel_api2_response;
    }

    /**
     * @param $response
     *
     * @return bool
     */
    public function api2ResponseOk($response)
    {
        return $response['cpanelresult']['error'] === null;
    }

    /**
     * @param $domain_name
     *
     * @return array|null
     */
    public function getDNSRecords($domain_name)
    {
        $fetch_zone_records_result = $this->api2('ZoneEdit', 'fetchzone_records', array('domain' => $domain_name));

        if ($this->api2ResponseOk($fetch_zone_records_result)) {
            $dnsRecordList = array();
            foreach ($fetch_zone_records_result['cpanelresult']['data'] as $cpanelDNSRecord) {
                //if this is a record CloudFlare can proxy
                if (!in_array($cpanelDNSRecord['type'], CpanelDNSRecord::$DNS_RECORDS_CF_CANNOT_PROXY)) {
                    $cfDNSRecord = new CpanelDNSRecord();
                    $content = ($cpanelDNSRecord['type'] === 'CNAME') ? $cpanelDNSRecord['cname'] : $cpanelDNSRecord['address'];
                    $cfDNSRecord->setContent($content);
                    $cfDNSRecord->setName($cpanelDNSRecord['name']);
                    $cfDNSRecord->setLine($cpanelDNSRecord['line']);
                    $cfDNSRecord->setTtl($cpanelDNSRecord['ttl']);
                    $cfDNSRecord->setType($cpanelDNSRecord['type']);
                    array_push($dnsRecordList, $cfDNSRecord);
                }
            }

            return $dnsRecordList;
        }

        return;
    }

    /**
     * @param $domain_name
     * @param DNSRecord $dnsRecord
     *
     * @return bool
     */
    public function addDNSRecord($domain_name, DNSRecord $dnsRecord)
    {
        $args = array(
            'domain' => $domain_name,
            'name' => $dnsRecord->getName(),
            'class' => 'IN',
            'ttl' => $dnsRecord->getTtl(),
            'type' => $dnsRecord->getType(),
        );

        if ($dnsRecord->getType() === 'CNAME') {
            $args['cname'] = $dnsRecord->getContent();
        } else { //A, AAAA
            $args['address'] = $dnsRecord->getContent();
        }

        $add_zone_record_response = $this->api2('ZoneEdit', 'add_zone_record', $args);

        return $this->api2ResponseOk($add_zone_record_response);
    }

    /**
     * @param $domain_name
     * @param DNSRecord $dnsRecord
     *
     * @return bool
     */
    public function editDNSRecord($domain_name, DNSRecord $dnsRecord)
    {
        //$dnsRecords should be an instance of CF\Cpanel\CPanelDNSRecord
        $args = array(
            'Line' => $dnsRecord->getLine(),
            'domain' => $domain_name,
            'name' => $dnsRecord->getName(),
            'type' => $dnsRecord->getType(),
            'ttl' => $dnsRecord->getTtl(),
            'class' => 'IN',
        );

        if ($dnsRecord->getType() === 'CNAME') {
            $args['cname'] = $dnsRecord->getContent();
        } else { //A, AAAA
            $args['address'] = $dnsRecord->getContent();
        }

        $edit_zone_record_response = $this->api2('ZoneEdit', 'edit_zone_record', $args);

        return $this->api2ResponseOk($edit_zone_record_response);
    }

    public function removeDNSRecord($domain_name, DNSRecord $DNSRecord)
    {
        $args = array(
            'domain' => $domain_name,
            'line' => $DNSRecord->getLine(),
        );

        $remove_zone_record_response = $this->api2('ZoneEdit', 'remove_zone_record', $args);

        return $this->api2ResponseOk($remove_zone_record_response);
    }

    /**
     * @param $module
     * @param $function
     * @param $parameters
     * @param $value
     *
     * @return mixed
     *
     * @throws \Exception
     */
    private function uapi($module, $function, $parameters, $value)
    {
        $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'request', 'module' => $module, 'function' => $function, 'parameters' => $parameters), true);

        $cpanel_uapi_response = $this->cpanel_api->uapi($module, $function, $parameters, $value);

        $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'response', 'body' => $this->sanitize_uapi_response_for_log($cpanel_uapi_response)), $this->uapi_response_ok($cpanel_uapi_response));
        if ($this->uapi_response_ok($cpanel_uapi_response)) {
            return $cpanel_uapi_response['cpanelresult']['result']['data'];
        } else {
            $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'request', 'module' => $module, 'function' => $function, 'parameters' => $parameters), false);
            $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'response', 'body' => $this->sanitize_uapi_response_for_log($cpanel_uapi_response)), false);

            return $cpanel_uapi_response;
        }
    }

    /**
     * @param $cpanel_uapi_response
     *
     * @return bool
     */
    public function uapi_response_ok($cpanel_uapi_response) // @codingStandardsIgnoreLine
    {
        return $cpanel_uapi_response['cpanelresult']['result']['errors'] === null;
    }

    /**
     * @param $cpanel_uapi_response
     *
     * @return mixed
     */
    private function sanitize_uapi_response_for_log($cpanel_uapi_response) // @codingStandardsIgnoreLine
    {
        if ($this->uapi_response_ok($cpanel_uapi_response)) {
            if ($cpanel_uapi_response['cpanelresult']['func'] === 'get_host_api_key') {
                $cpanel_uapi_response['cpanelresult']['result']['data'] = '[HIDDEN]';
            }
        }

        return $cpanel_uapi_response;
    }

    /**
     * @return home directory for current cpanel user
     */
    public function get_home_dir() // @codingStandardsIgnoreLine
    {
        //cpanelprint won't error, if it can't find the value it prints the input
        return $this->cpanel_api->cpanelprint('$homedir');
    }

    /**
     * @return host api key
     *
     * @throws \Exception
     */
    public function getHostAPIKey()
    {
        return $this->uapi('CloudFlare', 'get_host_api_key', array(), null);
    }

    /**
     * @return current cpanel username
     */
    public function getUserId()
    {
        //cpanelprint won't error, if it can't find the value it returns the input
        return $this->cpanel_api->cpanelprint('$user');
    }

    /**
     * @param $userId
     *
     * @return mixed
     */
    public function getDomainList($userId = null)
    {
        return $this->uapi(
            'DomainInfo',
            'list_domains',
            array(),
            null
        );
    }

    /**
     * @param $folder
     * @param $filename
     *
     * @return mixed
     *
     * @throws \Exception
     */
    public function load_file($folder, $filename) // @codingStandardsIgnoreLine
    {
        return $this->uapi(
            'Fileman',
            'get_file_content',
            array(
                'dir' => $folder,
                'file' => $filename,
                'from_charset' => '_DETECT_',
                'to_charset' => '_LOCALE_',
            ),
            null
        );
    }

    /**
     * @param $folder
     * @param $filename
     * @param $file_contents
     *
     * @throws \Exception
     */
    public function save_file($folder, $filename, $file_contents) // @codingStandardsIgnoreLine
    {
        $this->uapi(
            'Fileman',
            'save_file_content',
            array(
                'dir' => $folder,
                'file' => $filename,
                'from_charset' => 'UTF-8',
                'to_charset' => 'UTF-8',
                'content' => $file_contents,
            ),
            null
        );
    }

    public function get_cpanel_dns_record_name($cloudflare_dns_record_name) // @codingStandardsIgnoreLine
    {
        //cpanel uses the trailing dot for all record names
        return $cloudflare_dns_record_name.'.';
    }

    /**
     * @return bool
     */
    public function isAdvancedZoneEditEnabled()
    {
        /* Advanced Zone Editor is required to edit DNS records for partial zone provisioning.
         * https://documentation.cpanel.net/display/SDK/Guide+to+the+LiveAPI+System+-+The+cpanelfeature%28%29+Method
         * cPanel returns 1 = enabled, 0 = disabled
         */
        return $this->cpanel_api->cpanelfeature('zoneedit') === 1;
    }

    public function logAPICall($api, $message, $is_debug)
    {
        $log_level = 'error';
        if ($is_debug) {
            $log_level = 'debug';
        }
        if (!is_string($message)) {
            $message = print_r($message, true);
        }
        $this->logger->$log_level('['.$api.'] '.$message);
    }
}
