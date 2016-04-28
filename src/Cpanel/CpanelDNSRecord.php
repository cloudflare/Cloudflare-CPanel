<?php
/**
 * Created by IntelliJ IDEA.
 * User: johnwineman
 * Date: 4/19/16
 * Time: 9:52 AM
 */

namespace CF\Cpanel;

use CF\DNSRecord;

class CpanelDNSRecord extends DNSRecord
{
    private $line;

    /**
     * @return mixed
     */
    public function getLine()
    {
        return $this->line;
    }

    /**
     * @param mixed $line
     */
    public function setLine($line)
    {
        $this->line = $line;
    }
}
