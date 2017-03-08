<?php

namespace CF\API\Test;

use GuzzleHttp;
use GuzzleHttp\Message\RequestInterface;
use GuzzleHttp\Message\ResponseInterface;
use CF\Integration\DefaultIntegration;
use CF\Integration\DefaultLogger;
use CF\Integration\DataStoreInterface;
use CF\Integration\IntegrationAPIInterface;
use \CF\API\Request;
use \CF\API\AbstractAPIClient;
use \CF\Integration\DefaultConfig;

class AbstractAPIClientTest extends \PHPUnit_Framework_TestCase
{
    protected $mockAbstractAPIClient;
    protected $mockAPI;
    protected $mockClient;
    protected $mockConfig;
    protected $mockDataStore;
    protected $mockLogger;
    protected $mockRequest;
    protected $mockGuzzleRequest;
    protected $mockGuzzleResponse;

    const TOTAL_PAGES = 3;
    const MOCK_RESPONSE = [
      'result' => [],
      'result_info' => [
        'total_pages' => self::TOTAL_PAGES
      ]
    ];

    public function setup()
    {
        $this->mockRequest = $this->getMockBuilder(Request::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->mockClient = $this->getMockBuilder(GuzzleHttp\Client::class)
            ->disableOriginalConstructor()
            ->getMock();

        $this->mockGuzzleRequest = $this->getMockBuilder(RequestInterface::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClient->method('createRequest')->willReturn($this->mockGuzzleRequest);

        $this->mockGuzzleResponse = $this->getMockBuilder(ResponseInterface::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockClient->method('send')->willReturn($this->mockGuzzleResponse);

        $this->mockConfig = $this->getMockBuilder(DefaultConfig::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockConfig->method('getValue')->willReturn(true);
        $this->mockAPI = $this->getMockBuilder(IntegrationAPIInterface::class)
            ->getMock();
        $this->mockDataStore = $this->getMockBuilder(DataStoreInterface::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockLogger = $this->getMockBuilder(DefaultLogger::class)
            ->disableOriginalConstructor()
            ->getMock();
        $this->mockIntegration = new DefaultIntegration($this->mockConfig, $this->mockAPI, $this->mockDataStore, $this->mockLogger);

        $this->mockAbstractAPIClient = $this->getMockBuilder(AbstractAPIClient::class)
            ->setConstructorArgs([$this->mockIntegration])
            ->getMockForAbstractClass();
        $this->mockAbstractAPIClient->setClient($this->mockClient);
    }

    public function testSendRequestCallsGuzzleSend()
    {
          $this->mockGuzzleResponse->method('json')->willReturn(true);
          $this->mockClient->expects($this->once())->method('send');

          $this->mockAbstractAPIClient->sendRequest($this->mockRequest);
    }

    public function testGetGuzzleRequestReturnsGuzzleRequest()
    {
        $this->assertInstanceOf(RequestInterface::class, $this->mockAbstractAPIClient->getGuzzleRequest($this->mockRequest));
    }

    public function testGetPaginatedResultsRequestsAllPages()
    {
        $this->mockRequest->method('getMethod')->willReturn('GET');
        $this->mockGuzzleResponse->method('json')->willReturn(self::MOCK_RESPONSE);
        $this->mockClient->expects($this->exactly((self::TOTAL_PAGES - 1)))->method('send');
        $this->mockAbstractAPIClient->getPaginatedResults($this->mockRequest, self::MOCK_RESPONSE);
    }

    public function testGetPaginatedResultsOnlyExecutesForGET()
    {
        $methods = ['DELETE', 'PUT', 'PATCH', 'POST'];
        $this->mockClient->expects($this->never())->method('send');

        foreach ($methods as $method) {
            $this->mockRequest = $this->getMockBuilder(Request::class)
                ->disableOriginalConstructor()
                ->getMock();
            $this->mockRequest->method('getMethod')->willReturn($method);
            $this->mockAbstractAPIClient->getPaginatedResults($this->mockRequest, self::MOCK_RESPONSE);
        }
    }

    public function testGetPaginatedResultsOnlyExecutesForPagedResults()
    {
        $this->mockClient->expects($this->never())->method('send');
        $this->mockAbstractAPIClient->getPaginatedResults($this->mockRequest, []);
    }

    public function testGetPathReturnsPath()
    {
        $endpoint = 'http://api.cloudflare.com/client/v4';
        $path = '/zones';
        $this->mockRequest->method('getUrl')->willReturn($endpoint.$path);
        $this->mockAbstractAPIClient->method('getEndpoint')->willReturn($endpoint);
        $this->assertEquals($path, $this->mockAbstractAPIClient->getPath($this->mockRequest));
    }

    public function testShouldRouteRequestReturnsTrueForValidRequest()
    {
        $endpoint = 'http://api.cloudflare.com/client/v4';
        $url = $endpoint.'/zones';
        $this->mockRequest->method('getUrl')->willReturn($url);
        $this->mockAbstractAPIClient->method('getEndpoint')->willReturn($endpoint);
        $this->assertTrue($this->mockAbstractAPIClient->shouldRouteRequest($this->mockRequest));
    }

    public function testShouldRouteRequestReturnsFalseForInvalidRequest()
    {
        $this->mockRequest->method('getUrl')->willReturn('http://api.cloudflare.com/client/v4/zones');
        $this->mockAbstractAPIClient->method('getEndpoint')->willReturn('https://api.cloudflare.com/host-gw.html');
        $this->assertFalse($this->mockAbstractAPIClient->shouldRouteRequest($this->mockRequest));
    }
}
