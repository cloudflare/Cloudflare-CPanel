<?php

namespace CF\Cpanel;

class HostRoutes
{
    /*
     * Since the host API isn't RESTful we use $_POST['act'] as the path.
     * All Host API calls should be carried out over POST per the docs as well.
     */
    public static $routes = array(
        'user_auth' => array(
            'class' => 'CF\Cpanel\HostActions',
            'methods' => array(
                'POST' => array(
                    'function' => 'userAuth'
                )
            )
        ),
        'user_create' => array(
            'class' => 'CF\Cpanel\HostActions',
            'methods' => array(
                'POST' => array(
                    'function' => 'userCreate'
                )
            )
        ),
        'zone_set' => array(
            'class' => 'CF\Cpanel\HostActions',
            'methods' => array(
                'POST' => array(
                    'function' => 'partialZoneSet'
                )
            )
        ),
    );
}
