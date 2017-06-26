<?php

namespace CF\Cpanel;

use CF\API\APIInterface;
use CF\API\Request;
use CF\Cpanel\Zone\Partial;
use CF\Integration\DefaultIntegration;
use TrueBV\Punycode;

class ClientActions
{
    private $api;
    private $config;
    private $cpanelAPI;
    private $dataStore;
    private $logger;
    private $partialZoneSet;
    private $request;
    private $punyCoder;

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

        $this->setPunycoder();
    }

    public function setPunycoder($p = null) {
        $this->punyCode = $p;
        if (is_null($p)) {
            $this->punyCoder = new Punycode();
        }
    }

    public function getPunycoder() {
        return $this->punyCoder;
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
        $getCpanelDomains = $this->cpanelAPI->getDomainList();

        //addon and primary domains are A records to the main_domain so for Cpanel its always a list of one
        $cpanelDomainList = array($getCpanelDomains['main_domain']);
        if (array_key_exists('addon_domains', $getCpanelDomains) && !is_null($getCpanelDomains['addon_domains'])) {
            $cpanelDomainList = array_merge($cpanelDomainList, $getCpanelDomains['addon_domains']);
        }

        if (array_key_exists('parked_domains', $getCpanelDomains) && !is_null($getCpanelDomains['parked_domains'])) {
            $cpanelDomainList = array_merge($cpanelDomainList, $getCpanelDomains['parked_domains']);
        }

        $mergedDomainList = array();
        foreach ($cpanelDomainList as $cpanelDomain) {
            $found = false;

            $cpanelDomain = $this->getPunycoder()->encode($cpanelDomain);

            $request = new Request('GET', 'zones/', array('name' => $cpanelDomain), array());
            $cpanelZone = $this->api->callAPI($request);

            if ($this->api->responseOk($cpanelZone)) {
                foreach ($cpanelZone['result'] as $cfZone) {
                    $cpanelDomain = $this->getPunycoder()->decode($cpanelDomain);

                    if ($cfZone['name'] === $cpanelDomain) {
                        $found = true;
                        array_push($mergedDomainList, $cfZone);
                    }
                }
            }

            if ($found === false) {
                array_push($mergedDomainList, array(
                        'name' => $cpanelDomain,
                        'plan' => array('name' => ''),
                        'type' => '',
                        'status' => 'inactive',
                    ));
            }
        }

        $cfZonesList = array();
        $cfZonesList['result'] = $mergedDomainList;
        $cfZonesList['success'] = true;

        $this->addSSLVerficiationDNSRecordForCName($mergedDomainList);

        return $cfZonesList;
    }

    /**
     * PI-954
     * This function is added from CA's decision on validating subdomain to issue wildcard cert.
     * tl;dr We need to add SSL Verification DNS records manually if the zone is provisioned
     * with CName.
     */
    public function addSSLVerficiationDNSRecordForCName($zoneList)
    {
        foreach ($zoneList as $zone) {
            $zoneId = isset($zone['id']) ? $zone['id'] : null;
            $zoneName = isset($zone['name']) ? $zone['name'] : null;

            // Check if the zone is cname
            if (isset($zoneId) && strtolower($zone['type']) === 'cname') {
                $request = new Request('GET', 'zones/'.$zoneId.'/ssl/verification', array(), array());
                $sslCerts = $this->api->callAPI($request);
                if ($this->api->responseOk($sslCerts)) {
                    $dnsRecords = $this->cpanelAPI->getDNSRecords($zoneName);
                    if (!isset($dnsRecords)) {
                        $this->logger->info('Getting DNS Records failed');
                        continue;
                    }

                    foreach ($sslCerts['result'] as $cert) {
                        // Checkinng if the record already exists is not necessary cause CPanel
                        // doesn't allow the same record being added multiple times.
                        //
                        // Assumption:
                        // 1) $cert['certificate_status'] being active or inactive doesn't matter
                        // We'll add the record regardless. The worst case is extra DNS Records.
                        // 2) $cert['verification_type'] is always cname for our current CA partners
                        // we don't check whether it's cname because it's not needed
                        $recordName = strtolower($cert['verification_info']['record_name']);
                        $recordTarget = strtolower($cert['verification_info']['record_target']);

                        // CPanel api expects the record name to be the subdomain
                        // In our case the record name is in format subdomain.domain.com
                        // We need to remove the ".domain.com' part before sending it
                        // to CPanel API
                        $recordName = str_replace('.'.$zoneName, '', $recordName);

                        // Create a new DNS Record
                        $dnsRecord = new CpanelDNSRecord();
                        $dnsRecord->setType('CNAME');
                        $dnsRecord->setName($recordName);
                        $dnsRecord->setContent($recordTarget);
                        $dnsRecord->setTtl(14400);

                        $this->cpanelAPI->addDNSRecord($zoneName, $dnsRecord);
                    }
                } else {
                    $this->logger->info('SSL request failed');
                    $this->logger->info($sslCerts);
                }
            }
        }
    }

    /**
     * POST /zones/:id/dns_records.
     *
     * @return array|string
     */
    public function createDNSRecord()
    {
        $createDnsRecordResult = $this->api->callAPI($this->request);
        if ($this->api->responseOk($createDnsRecordResult)) {
            $domainName = $createDnsRecordResult['result']['zone_name'];
            /*
            * Only create the DNS record on CPanel if it was provisioned with CNAME setup, aka if the resolve-to DNS record is set.
            */
            if ($this->partialZoneSet->getResolveToDNSRecord($this->cpanelAPI->getDNSRecords($domainName)) !== null) {
                //cpanel record names have trailing dot
                $createDnsRecordResult['result']['name'] = $this->cpanelAPI->getCpanelDnsRecordName($createDnsRecordResult['result']['name']);
                $subDomain = $createDnsRecordResult['result']['name'];

                if ($this->partialZoneSet->partialZoneSet($subDomain, $domainName)) {
                    return $createDnsRecordResult;
                } else {
                    return $this->api->createAPIError("Could not modify Cpanel DNS record for '".$subDomain."', please contact your host.");
                }
            }
        }

        return $createDnsRecordResult;
    }

    /**
     * PATCH /zones/:id/dns_records/:id.
     *
     * @return string
     */
    public function patchDNSRecord()
    {
        $patchDnsRecordResult = $this->api->callAPI($this->request);
        if ($this->api->responseOk($patchDnsRecordResult)) {
            $patchDnsRecordResult['result']['name'] = $this->cpanelAPI->getCpanelDnsRecordName($patchDnsRecordResult['result']['name']);
        }

        return $patchDnsRecordResult;
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

        $pathArray = explode('/', $this->request->getUrl());
        $zoneTag = $pathArray[1];

        //try to remove partial zone set up IF it exists
        if ($zoneTag !== null) {
            $zoneGetDetailsResponse = $this->api->zoneGetDetails($zoneTag);
            if ($this->api->responseOk($zoneGetDetailsResponse)) {
                $domainName = $zoneGetDetailsResponse['result']['name'];
                if ($domainName !== null) {
                    if ($this->partialZoneSet->removePartialZoneSet($domainName) === false) {
                        return $this->api->createAPIError("CPanel was unable to update the DNS records for '".$domainName."' to no longer point at Cloudflare.  Please contact your host.");
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
        $cfDnsRecordList = $this->api->callAPI($this->request);
        if (!$this->api->responseOk($cfDnsRecordList)) {
            return $cfDnsRecordList;
        }

        $pathArray = explode('/', $this->request->getUrl());
        $zoneId = $pathArray[1];

        $zoneGetDetailsResponse = $this->api->zoneGetDetails($zoneId);
        if (!$this->api->responseOk($zoneGetDetailsResponse)) {
            return $this->api->createAPIError('Could not merge DNS record because zone details could not be retrieved.');
        }

        $domainName = $zoneGetDetailsResponse['result']['name'];

        $cpanelDnsRecordList = $this->cpanelAPI->getDNSRecords($domainName);

        if (!$this->cpanelAPI->uapiResponseOk($cfDnsRecordList)) {
            return $this->api->createAPIError("Error getting the DNS records for '".$domainName."' from Cpanel.");
        }

        $cfDnsRecordNameList = array($this->partialZoneSet->getResolveToValue($domainName));

        // The user cant provision the root domain or the resolve to record
        // so we add them to the name list to prevent them from being added
        // when we loop through the cpanel DNS records.
        // If the setup is full zone we want the record to be added to the
        // cfDnsRecordList results.
        if ($this->partialZoneSet->getResolveToDNSRecord($cpanelDnsRecordList) !== null) {
            array_push($cfDnsRecordNameList, $domainName.'.');
        }

        foreach ($cfDnsRecordList['result'] as $key => $cfDnsRecord) {
            //add trailing dot to cf dns record names
            $cfDnsRecordList['result'][$key]['name'] = $this->cpanelAPI->getCpanelDnsRecordName($cfDnsRecordList['result'][$key]['name']);

            //build list of dns record names
            array_push($cfDnsRecordNameList, $cfDnsRecordList['result'][$key]['name']);
        }

        foreach ($cpanelDnsRecordList as $cpanelDnsRecord) {
            //if the record a type Cloudflare can proxy
            if (!in_array(strtoupper($cpanelDnsRecord->getType()), CpanelDNSRecord::$DNS_RECORDS_CF_CANNOT_PROXY)) {
                //if the cpanel record isn't in the array, add it.
                if (!in_array($cpanelDnsRecord->getName(), $cfDnsRecordNameList)) {
                    array_push($cfDnsRecordList['result'], array(
                        'name' => $cpanelDnsRecord->getName(),
                        'type' => $cpanelDnsRecord->getType(),
                        'content' => $cpanelDnsRecord->getContent(),
                        'ttl' => $cpanelDnsRecord->getTtl(),
                        'proxied' => false,
                        'zone_id' => $zoneId,
                    ));
                }
            }
        }

        return $cfDnsRecordList;
    }
}
