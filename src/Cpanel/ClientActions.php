<?php

namespace CF\Cpanel;

use CF\API\APIInterface;
use CF\API\Request;
use CF\Cpanel\Zone\Partial;
use CF\Integration\DefaultIntegration;

class ClientActions
{
    private $api;
    private $config;
    private $cpanelAPI;
    private $dataStore;
    private $logger;
    private $partialZoneSet;
    private $request;

    /**
     * @param DefaultIntegration $cpanelIntegration
     * @param APIInterface       $api
     * @param Request            $request
     */
    public function __construct(DefaultIntegration $cpanelIntegration, APIInterface $api, Request $request)
    {
        $this->api = $api;
        $this->config = $cpanelIntegration->getConfig();
        $this->cpanelAPI = $cpanelIntegration->getIntegrationAPI();
        $this->dataStore = $cpanelIntegration->getDataStore();
        $this->logger = $cpanelIntegration->getLogger();
        $this->partialZoneSet = new Partial($this->cpanelAPI, $this->dataStore, $this->logger);
        $this->request = $request;
    }

    /**
     * @param Partial $partialZoneSet
     */
    public function setPartialZoneSet(Partial $partialZoneSet)
    {
        $this->partialZoneSet = $partialZoneSet;
    }

    /**
     * GET /zones.
     *
     * @return mixed
     */
    public function mergeCpanelAndCFDomains()
    {
        $get_cpanel_domains = $this->cpanelAPI->getDomainList();

        //addon and primary domains are A records to the main_domain so for Cpanel its always a list of one
        $cpanel_domain_list = array($get_cpanel_domains['main_domain']);
        if (array_key_exists('addon_domains', $get_cpanel_domains) && !is_null($get_cpanel_domains['addon_domains'])) {
            $cpanel_domain_list = array_merge($cpanel_domain_list, $get_cpanel_domains['addon_domains']);
        }

        if (array_key_exists('parked_domains', $get_cpanel_domains) && !is_null($get_cpanel_domains['parked_domains'])) {
            $cpanel_domain_list = array_merge($cpanel_domain_list, $get_cpanel_domains['parked_domains']);
        }

        $merged_domain_list = array();
        foreach ($cpanel_domain_list as $cpanel_domain) {
            $found = false;

            $request = new Request('GET', 'zones/', array('name' => $cpanel_domain), array());
            $cpanel_zone = $this->api->callAPI($request);

            if ($this->api->responseOk($cpanel_zone)) {
                foreach ($cpanel_zone['result'] as $cf_zone) {
                    if ($cf_zone['name'] === $cpanel_domain) {
                        $found = true;
                        array_push($merged_domain_list, $cf_zone);
                    }
                }
            }

            if ($found === false) {
                array_push($merged_domain_list, array(
                        'name' => $cpanel_domain,
                        'plan' => array('name' => ''),
                        'type' => '',
                        'status' => 'inactive',
                    ));
            }
        }

        $cf_zones_list = array();
        $cf_zones_list['result'] = $merged_domain_list;
        $cf_zones_list['success'] = true;

        return $cf_zones_list;
    }

    /**
     * POST /zones/:id/dns_records.
     *
     * @return array|string
     */
    public function createDNSRecord()
    {
        $create_dns_record_result = $this->api->callAPI($this->request);
        if ($this->api->responseOk($create_dns_record_result)) {
            $domain_name = $create_dns_record_result['result']['zone_name'];
            /*
            * Only create the DNS record on CPanel if it was provisioned with CNAME setup, aka if the resolve-to DNS record is set.
            */
            if ($this->partialZoneSet->getResolveToDNSRecord($this->cpanelAPI->getDNSRecords($domain_name)) !== null) {
                //cpanel record names have trailing dot
                $create_dns_record_result['result']['name'] = $this->cpanelAPI->get_cpanel_dns_record_name($create_dns_record_result['result']['name']);
                $sub_domain = $create_dns_record_result['result']['name'];

                if ($this->partialZoneSet->partialZoneSet($sub_domain, $domain_name)) {
                    return $create_dns_record_result;
                } else {
                    return $this->api->createAPIError("Could not modify Cpanel DNS record for '".$sub_domain."', please contact your host.");
                }
            }
        }

        return $create_dns_record_result;
    }

    /**
     * PATCH /zones/:id/dns_records/:id.
     *
     * @return string
     */
    public function patchDNSRecord()
    {
        $patch_dns_record_result = $this->api->callAPI($this->request);
        if ($this->api->responseOk($patch_dns_record_result)) {
            $patch_dns_record_result['result']['name'] = $this->cpanelAPI->get_cpanel_dns_record_name($patch_dns_record_result['result']['name']);
        }

        return $patch_dns_record_result;
    }

    /**
     * DELETE /zones/:id.
     *
     * @return mixed
     */
    public function deleteZone()
    {
        if (!$this->cpanelAPI->isAdvancedZoneEditEnabled()) {
            return $this->api->createAPIError(Partial::ADVANCED_ZONE_EDIT_DISABLED_ERROR);
        }

        $path_array = explode('/', $this->request->getUrl());
        $zone_tag = $path_array[1];

        //try to remove partial zone set up IF it exists
        if ($zone_tag !== null) {
            $zone_get_details_response = $this->api->zoneGetDetails($zone_tag);
            if ($this->api->responseOk($zone_get_details_response)) {
                $domain_name = $zone_get_details_response['result']['name'];
                if ($domain_name !== null) {
                    if ($this->partialZoneSet->removePartialZoneSet($domain_name) === false) {
                        return $this->api->createAPIError("CPanel was unable to update the DNS records for '".$domain_name."' to no longer point at Cloudflare.  Please contact your host.");
                    }
                }
            }
        }

        return $this->api->callAPI($this->request);
    }

    /**
     * GET /zones/:id/dns_records.
     *
     * @return string
     */
    public function mergeDNSRecords()
    {
        $cf_dns_record_list = $this->api->callAPI($this->request);
        if (!$this->api->responseOk($cf_dns_record_list)) {
            return $cf_dns_record_list;
        }

        $path_array = explode('/', $this->request->getUrl());
        $zone_id = $path_array[1];

        $zone_get_details_response = $this->api->zoneGetDetails($zone_id);
        if (!$this->api->responseOk($zone_get_details_response)) {
            return $this->api->createAPIError('Could not merge DNS record because zone details could not be retrieved.');
        }

        $domain_name = $zone_get_details_response['result']['name'];

        $cpanel_dns_record_list = $this->cpanelAPI->getDNSRecords($domain_name);

        if (!$this->cpanelAPI->uapi_response_ok($cf_dns_record_list)) {
            return $this->api->createAPIError("Error getting the DNS records for '".$domain_name."' from Cpanel.");
        }

        $cf_dns_record_name_list = array($this->partialZoneSet->getResolveToValue($domain_name));

        //The user cant provision the root domain or the resolve to record so we add them to the name list to prevent them
        //from being added when we loop through the cpanel DNS records
        if ($this->partialZoneSet->getResolveToDNSRecord($cpanel_dns_record_list) !== null) {
            array_push($cf_dns_record_name_list, $domain_name.'.');
        }

        foreach ($cf_dns_record_list['result'] as $key => $cf_dns_record) {
            //add trailing dot to cf dns record names
            $cf_dns_record_list['result'][$key]['name'] = $this->cpanelAPI->get_cpanel_dns_record_name($cf_dns_record_list['result'][$key]['name']);

            //build list of dns record names
            array_push($cf_dns_record_name_list, $cf_dns_record_list['result'][$key]['name']);
        }

        foreach ($cpanel_dns_record_list as $cpanel_dns_record) {
            //if the record a type Cloudflare can proxy
            if (!in_array(strtoupper($cpanel_dns_record->getType()), CpanelDNSRecord::$DNS_RECORDS_CF_CANNOT_PROXY)) {
                //if the cpanel record isn't in the array, add it.
                if (!in_array($cpanel_dns_record->getName(), $cf_dns_record_name_list)) {
                    array_push($cf_dns_record_list['result'], array(
                        'name' => $cpanel_dns_record->getName(),
                        'type' => $cpanel_dns_record->getType(),
                        'content' => $cpanel_dns_record->getContent(),
                        'ttl' => $cpanel_dns_record->getTtl(),
                        'proxied' => false,
                        'zone_id' => $zone_id,
                    ));
                }
            }
        }

        return $cf_dns_record_list;
    }
}
