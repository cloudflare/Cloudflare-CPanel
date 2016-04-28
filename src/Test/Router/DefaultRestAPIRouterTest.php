<?php

namespace CF\Router\Test;

use CF\API\Request;
use CF\Cpanel\CpanelIntegration;
use \CF\Router\DefaultRestAPIRouter;

class DefaultRestAPIRouterTest extends \PHPUnit_Framework_TestCase
{

    private $clientV4APIRouter;
    private $mockConfig;
    private $mockClientAPI;
    private $mockCpanelAPI;
    private $mockCpanelIntegration;
    private $mockDataStore;
    private $mockLogger;
    private $mockRoutes = array();

    public function setup()
    {
        $this->mockConfig = $this->getMockBuilder('CF\Integration\DefaultConfig')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClientAPI = $this->getMockBuilder('CF\API\Client')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelAPI = $this->getMockBuilder('CF\Cpanel\CpanelAPI')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder('CF\Cpanel\DataStore')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder('CF\Integration\DefaultLogger')
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockCpanelIntegration = new CpanelIntegration($this->mockConfig, $this->mockCpanelAPI, $this->mockDataStore, $this->mockLogger);
        $this->clientV4APIRouter = new DefaultRestAPIRouter($this->mockCpanelIntegration, $this->mockClientAPI, $this->mockRoutes);
    }

    public function testGetRouteReturnsClassFunctionForValidRoute()
    {
        $routes = array(
            'zones' => array(
                'class' => 'testClass',
                'methods' => array(
                    'GET' => array(
                        'function' => 'testFunction'
                    )
                )
            )
        );
        $this->clientV4APIRouter->setRoutes($routes);

        $request = new Request("GET", "zones", array(), array());

        $response = $this->clientV4APIRouter->getRoute($request);

        $this->assertEquals(array(
            'class' => 'testClass',
            'function' => 'testFunction'
        ), $response);
    }

    public function testGetRouteReturnsFalseForNoRouteFound()
    {
        $request = new Request("GET", "zones", array(), array());
        $response = $this->clientV4APIRouter->getRoute($request);
        $this->assertFalse($response);
    }
}
