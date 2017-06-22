<?php

namespace CF\Cpanel;

use CF\DNSRecord;
use CF\Integration\IntegrationAPIInterface;
use CF\Integration\DefaultLogger;

class CpanelAPI implements IntegrationAPIInterface
{
    private $cpanelApi;
    private $logger;

    const CPANEL_UAPI_NAME = 'CPANEL UAPI';
    const CPANEL_API2_NAME = 'CPANEL API2';

    /**
     * @param $cpanelApi
     * @param DefaultLogger $logger
     */
    public function __construct($cpanelApi, DefaultLogger $logger)
    {
        $this->cpanelApi = $cpanelApi;
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

        $cpanelApi2Response = $this->cpanelApi->api2($module, $function, $parameters);

        $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'response', $cpanelApi2Response), $this->api2ResponseOk($cpanelApi2Response));

        if (!$this->api2ResponseOk($cpanel_api2_response)) {
            $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'request', 'module' => $module, 'function' => $function, 'parameters' => $parameters), false);
            $this->logAPICall(self::CPANEL_API2_NAME, array('type' => 'response', 'body' => $cpanelApi2Response), false);
        }

        return $cpanelApi2Response;
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
        $fetchZoneRecordsResult = $this->api2('ZoneEdit', 'fetchzone_records', array('domain' => $domain_name));

        if ($this->api2ResponseOk($fetchZoneRecordsResult)) {
            $dnsRecordList = array();
            foreach ($fetchZoneRecordsResult['cpanelresult']['data'] as $cpanelDNSRecord) {
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

        $addZoneRecordResponse = $this->api2('ZoneEdit', 'add_zone_record', $args);

        return $this->api2ResponseOk($addZoneRecordResponse);
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

        $editZoneRecordResponse = $this->api2('ZoneEdit', 'edit_zone_record', $args);

        return $this->api2ResponseOk($editZoneRecordResponse);
    }

    public function removeDNSRecord($domain_name, DNSRecord $DNSRecord)
    {
        $args = array(
            'domain' => $domain_name,
            'line' => $DNSRecord->getLine(),
        );

        $removeZoneRecordResponse = $this->api2('ZoneEdit', 'remove_zone_record', $args);

        return $this->api2ResponseOk($removeZoneRecordResponse);
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

        $cpanelUApiResponse = $this->cpanelApi->uapi($module, $function, $parameters, $value);

        $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'response', 'body' => $this->sanitizeUApiResponseForLog($cpanelUApiResponse)), $this->uapiResponseOk($cpanelUApiResponse));
        if ($this->uapiResponseOk($cpanelUApiResponse)) {
            return $cpanelUApiResponse['cpanelresult']['result']['data'];
        } else {
            $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'request', 'module' => $module, 'function' => $function, 'parameters' => $parameters), false);
            $this->logAPICall(self::CPANEL_UAPI_NAME, array('type' => 'response', 'body' => $this->sanitizeUApiResponseForLog($cpanelUApiResponse)), false);

            return $cpanelUApiResponse;
        }
    }

    /**
     * @param $cpanelUApiResponse
     *
     * @return bool
     */
    public function uapiResponseOk($cpanelUApiResponse) // @codingStandardsIgnoreLine
    {
        return $cpanelUApiResponse['cpanelresult']['result']['errors'] === null;
    }

    /**
     * @param $cpanelUApiResponse
     *
     * @return mixed
     */
    private function sanitizeUApiResponseForLog($cpanelUApiResponse) // @codingStandardsIgnoreLine
    {
        if ($this->uapiResponseOk($cpanelUApiResponse)) {
            if ($cpanelUApiResponse['cpanelresult']['func'] === 'get_host_api_key') {
                $cpanelUApiResponse['cpanelresult']['result']['data'] = '[HIDDEN]';
            }
        }

        return $cpanelUApiResponse;
    }

    /**
     * @return home directory for current cpanel user
     */
    public function getHomeDir() // @codingStandardsIgnoreLine
    {
        //cpanelprint won't error, if it can't find the value it prints the input
        return $this->cpanelApi->cpanelprint('$homedir');
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
        return $this->cpanelApi->cpanelprint('$user');
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
    public function loadFile($folder, $filename) // @codingStandardsIgnoreLine
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
    public function saveFile($folder, $filename, $file_contents) // @codingStandardsIgnoreLine
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

    public function getCpanelDnsRecordName($cloudflare_dns_record_name) // @codingStandardsIgnoreLine
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
        return $this->cpanelApi->cpanelfeature('zoneedit') === 1;
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
