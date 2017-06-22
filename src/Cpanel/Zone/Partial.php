<?php

namespace CF\Cpanel\Zone;

use CF\Cpanel\CpanelAPI;
use CF\Cpanel\CpanelDNSRecord;
use CF\Cpanel\DataStore;
use Psr\Log\LoggerInterface;

class Partial
{
    private $cpanelApi;
    private $dataStore;
    private $logger;
    private $dnsRecordList;
    private $domainName;

    const FORWARD_TO_SUFFIX = 'cdn.cloudflare.net';
    const RESOLVE_TO_PREFIX = 'cloudflare-resolve-to.';
    const ADVANCED_ZONE_EDIT_DISABLED_ERROR = 'Cloudflare cPanel Plugin configuration issue! Please contact your hosting provider to enable "Advanced DNS Zone Editor"';

    /**
     * @param CpanelAPI               $cpanelApi
     * @param DataStore               $dataStore
     * @param Psr\Log\LoggerInterface $logger
     */
    public function __construct(CpanelAPI $cpanelApi, DataStore $dataStore, LoggerInterface $logger)
    {
        $this->cpanelApi = $cpanelApi;
        $this->dataStore = $dataStore;
        $this->logger = $logger;
    }

    /**
     * @param $sub_domain
     * @param $domainName
     *
     * @return bool
     */
    public function partialZoneSet($sub_domain, $domainName)
    {
        $this->domainName = $domainName;
        $this->dnsRecordList = $this->cpanelApi->getDNSRecords($domainName);
        if ($this->dnsRecordList === null) {
            return false;
        }

        $subDomainDnsRecord = $this->getSubDomainDNSRecord($sub_domain);
        if ($subDomainDnsRecord === null) {
            return false;
        }

        if (strtoupper($subDomainDnsRecord->getType()) === 'CNAME') {
            return $this->provisionSubDomainCNAMERecord($subDomainDnsRecord);
        } elseif (strtoupper($subDomainDnsRecord->getType()) === 'A') {
            return $this->provisionSubDomainARecord($subDomainDnsRecord);
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
        $this->domainName = $domainName;
        $this->dnsRecordList = $this->cpanelApi->getDNSRecords($domainName);
        if ($this->dnsRecordList === null) {
            return false;
        }

        $resolveToDNSRecord = $this->getResolveToDNSRecord($this->dnsRecordList);
        if ($resolveToDNSRecord === null) {
            //if there is no resolve to record it was provisioned with full zone and we don't need to do anything.
            return true;
        }

        //delete cloudflare-resolve-to.[DOMAIN]
        if (!$this->removeDNSRecord($resolveToDNSRecord->getLine())) {
            return false;
        }

        foreach ($this->dnsRecordList as $dnsRecord) {
            if ($dnsRecord->getType() === 'CNAME') {
                //if this domain is pointing at cloudflare revert it.
                if ($dnsRecord->getContent() === $this->getForwardToValue($dnsRecord->getName())) {
                    $dnsRecord->setContent($this->domainName);
                    if (!$this->cpanelApi->editDNSRecord($this->domainName, $dnsRecord)) {
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
    private function getSubDomainDNSRecord($subDomain)
    {
        //point www.DOMAIN. to www.DOMAIN.cdn.cloudflare.net regardless of whether its an A or CNAME record.
        if ($this->dnsRecordList !== null) {
            foreach ($this->dnsRecordList as $dnsRecord) {
                if ($dnsRecord->getName() === $subDomain) {
                    return $dnsRecord;
                }
            }
        }

        $this->logger->error("Could not find '".$subDomain."' in the '".$this->domainName."'. dns records.");

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
        $this->logger->error("Could not find the '".self::RESOLVE_TO_PREFIX."' record for '".$this->domainName."'.");

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
        if ($this->cpanelApi->editDNSRecord($this->domainName, $subDomainCNAMEDNSRecord)) {
            if ($this->getResolveToDNSRecord($this->dnsRecordList) === null) {
                //create CNAME cloudflare-resolve-to.[DOMAIN]. => [DOMAIN] if it doesn't exist.
                return $this->createCNAMERecord($this->getResolveToValue($this->domainName), $this->domainName);
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

        return $this->cpanelApi->addDNSRecord($this->domainName, $dnsRecord);
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
                if ($this->getResolveToDNSRecord($this->dnsRecordList) === null) {
                    return $this->createARecord($this->getResolveToValue($this->domainName), $subDomainARecordIP);
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

        return $this->cpanelApi->addDNSRecord($this->domainName, $dnsRecord);
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

        if ($this->cpanelApi->removeDNSRecord($this->domainName, $dnsRecord)) {
            //after we remove a dns record refresh the list since the line numbers have changed.
            $this->dnsRecordList = $this->cpanelApi->getDNSRecords($this->domainName);

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
