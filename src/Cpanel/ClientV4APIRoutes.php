<?php

namespace CF\Cpanel;

class ClientV4APIRoutes
{
    public static $routes = array(
        'zones' => array(
            'class' => 'CF\Cpanel\ClientActions',
            'methods' => array(
                'GET' => array(
                    'function' => 'mergeCpanelAndCFDomains'
                )
            )
        ),
        'zones/:id' => array(
            'class' => 'CF\Cpanel\ClientActions',
            'methods' => array(
                'DELETE' => array(
                    'function' => 'deleteZone'
                )
            )
        ),
        'zones/:id/dns_records' => array(
            'class' => 'CF\Cpanel\ClientActions',
            'methods' => array(
                'GET' => array(
                    'function' => 'mergeDNSRecords'
                ),
                'POST' => array(
                    'function' => 'createDNSRecord'
                )
            )
        ),
        'zones/:id/dns_records/:id' => array(
            'class' => 'CF\Cpanel\ClientActions',
            'methods' => array(
                'PATCH' => array(
                    'function' => 'patchDNSRecord'
                )
            )
        )
    );
}
