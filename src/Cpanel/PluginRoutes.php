<?php

namespace CF\Cpanel;

class PluginRoutes extends \CF\API\PluginRoutes
{
    /**
     * @param $routeList
     *
     * @return mixed
     */
    public static function getRoutes($routeList)
    {
        foreach ($routeList as $routePath => $route) {
            $route['class'] = 'CF\Cpanel\PluginActions';
            $routeList[$routePath] = $route;
        }

        return $routeList;
    }
}
