<?php

namespace CF\Cpanel\Zone;

use CF\Cpanel\CpanelAPI;
use CF\Cpanel\CpanelDNSRecord;
use CF\Cpanel\DataStore;
use Psr\Log\LoggerInterface;

class Partial
{
    private $cpanel_api;
    private $data_store;
    private $logger;
    private $dns_record_list;
    private $domain_name;

    const FORWARD_TO_SUFFIX = 'cdn.cloudflare.net';
    const RESOLVE_TO_PREFIX = 'cloudflare-resolve-to.';
    const ADVANCED_ZONE_EDIT_DISABLED_ERROR = 'Cloudflare cPanel Plugin configuration issue! Please contact your hosting provider to enable "Advanced DNS Zone Editor"';

    /**
     * @param CpanelAPI               $cpanel_api
     * @param DataStore               $data_store
     * @param Psr\Log\LoggerInterface $logger
     */
    public function __construct(CpanelAPI $cpanel_api, DataStore $data_store, LoggerInterface $logger)
    {
        $this->cpanel_api = $cpanel_api;
        $this->data_store = $data_store;
        $this->logger = $logger;
    }

    /**
     * @param $sub_domain
     * @param $domain_name
     *
     * @return bool
     */
    public function partialZoneSet($sub_domain, $domain_name)
    {
        $this->domain_name = $domain_name;
        $this->dns_record_list = $this->cpanel_api->getDNSRecords($domain_name);
        if ($this->dns_record_list === null) {
            return false;
        }

        $sub_domain_dns_record = $this->getSubDomainDNSRecord($sub_domain);
        if ($sub_domain_dns_record === null) {
            return false;
        }

        if (strtoupper($sub_domain_dns_record->getType()) === 'CNAME') {
            return $this->provisionSubDomainCNAMERecord($sub_domain_dns_record);
        } elseif (strtoupper($sub_domain_dns_record->getType()) === 'A') {
            return $this->provisionSubDomainARecord($sub_domain_dns_record);
        }

        return false;
    }

    /**
     * @param $domainName
     *
     * @return bool
     */
    public function removePartialZoneSet($domainName)
    {
        $this->domain_name = $domainName;
        $this->dns_record_list = $this->cpanel_api->getDNSRecords($domainName);
        if ($this->dns_record_list === null) {
            return false;
        }

        $resolveToDNSRecord = $this->getResolveToDNSRecord($this->dns_record_list);
        if ($resolveToDNSRecord === null) {
            //if there is no resolve to record it was provisioned with full zone and we don't need to do anything.
            return true;
        }

        //delete cloudflare-resolve-to.[DOMAIN]
        if (!$this->removeDNSRecord($resolveToDNSRecord->getLine())) {
            return false;
        }

        foreach ($this->dns_record_list as $dnsRecord) {
            if ($dnsRecord->getType() === 'CNAME') {
                //if this domain is pointing at cloudflare revert it.
                if ($dnsRecord->getContent() === $this->getForwardToValue($dnsRecord->getName())) {
                    $dnsRecord->setContent($this->domain_name);
                    if (!$this->cpanel_api->editDNSRecord($this->domain_name, $dnsRecord)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * @return mixed
     */
    private function getSubDomainDNSRecord($sub_domain)
    {
        //point www.DOMAIN. to www.DOMAIN.cdn.cloudflare.net regardless of whether its an A or CNAME record.
        if ($this->dns_record_list !== null) {
            foreach ($this->dns_record_list as $dns_record) {
                if ($dns_record->getName() === $sub_domain) {
                    return $dns_record;
                }
            }
        }

        $this->logger->error("Could not find '".$sub_domain."' in the '".$this->domain_name."'. dns records.");

        return;
    }

    /**
     * @param $dnsRecordList
     */
    public function getResolveToDNSRecord($dnsRecordList)
    {
        if ($dnsRecordList !== null) {
            foreach ($dnsRecordList as $dnsRecord) {
                if (strpos($dnsRecord->getName(), self::RESOLVE_TO_PREFIX) !== false) {
                    return $dnsRecord;
                }
            }
        }
        $this->logger->error("Could not find the '".self::RESOLVE_TO_PREFIX."' record for '".$this->domain_name."'.");

        return;
    }

    /**
     * @param $subDomainCNAMEDNSRecord
     *
     * @return bool
     */
    private function provisionSubDomainCNAMERecord($subDomainCNAMEDNSRecord)
    {
        //point [SUB DOMAIN].[DOMAIN] to [SUB DOMAIN].[DOMAIN].cdn.cloudflare.net
        $subDomainCNAMERecordValue = $this->getForwardToValue($subDomainCNAMEDNSRecord->getName());
        $subDomainCNAMEDNSRecord->setContent($subDomainCNAMERecordValue);
        if ($this->cpanel_api->editDNSRecord($this->domain_name, $subDomainCNAMEDNSRecord)) {
            if ($this->getResolveToDNSRecord($this->dns_record_list) === null) {
                //create CNAME cloudflare-resolve-to.[DOMAIN]. => [DOMAIN] if it doesn't exist.
                return $this->createCNAMERecord($this->getResolveToValue($this->domain_name), $this->domain_name);
            }

            return true;
        }

        return false;
    }

    /**
     * @param $name
     * @param $cnameValue
     *
     * @return bool
     */
    private function createCNAMERecord($name, $cnameValue)
    {
        $dnsRecord = new CpanelDNSRecord();
        $dnsRecord->setType('CNAME');
        $dnsRecord->setContent($cnameValue);
        $dnsRecord->setName($name);
        $dnsRecord->setTtl(1400);

        return $this->cpanel_api->addDNSRecord($this->domain_name, $dnsRecord);
    }

    /**
     * @param $subDomainDNSRecord
     *
     * @return bool
     */
    private function provisionSubDomainARecord($subDomainDNSRecord)
    {
        $subDomainARecordIP = $subDomainDNSRecord->getContent();

        //Delete www A record
        if ($this->removeDNSRecord($subDomainDNSRecord->getLine())) {
            $subDomaiCNAMERecordValue = $this->getForwardToValue($subDomainDNSRecord->getName());
            if ($this->createCNAMERecord($subDomainDNSRecord->getName(), $subDomaiCNAMERecordValue)) {
                if ($this->getResolveToDNSRecord($this->dns_record_list) === null) {
                    return $this->createARecord($this->getResolveToValue($this->domain_name), $subDomainARecordIP);
                }

                return true;
            }
        }

        return false;
    }

    /**
     * @param $name
     * @param $address
     *
     * @return bool
     */
    private function createARecord($name, $address)
    {
        $dnsRecord = new CpanelDNSRecord();
        $dnsRecord->setType('A');
        $dnsRecord->setContent($address);
        $dnsRecord->setName($name);
        $dnsRecord->setTtl(1400);

        return $this->cpanel_api->addDNSRecord($this->domain_name, $dnsRecord);
    }

    /**
     * @param $line
     *
     * @return bool
     */
    private function removeDNSRecord($line)
    {
        $dnsRecord = new CpanelDNSRecord();
        $dnsRecord->setLine($line);

        if ($this->cpanel_api->removeDNSRecord($this->domain_name, $dnsRecord)) {
            //after we remove a dns record refresh the list since the line numbers have changed.
            $this->dns_record_list = $this->cpanel_api->getDNSRecords($this->domain_name);

            return true;
        }

        return false;
    }

    /**
     * @param $subDomain
     *
     * @return string
     */
    public function getForwardToValue($subDomain)
    {
        return $subDomain.self::FORWARD_TO_SUFFIX;
    }

    /**
     * @param $domainName
     *
     * @return string
     */
    public function getResolveToValue($domainName)
    {
        return self::RESOLVE_TO_PREFIX.$domainName.'.';
    }
}
