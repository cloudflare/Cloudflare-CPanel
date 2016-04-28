<?php
namespace CF\API;

use GuzzleHttp;

class Client extends AbstractAPIClient
{
    const CLIENT_API_NAME = "CLIENT API";
    const ENDPOINT = "https://api.cloudflare.com/client/v4/";


    /**
     * @param Request $request
     * @return Request
     */
    public function beforeSend(Request $request)
    {
        $headers = array(
            "X-Auth-Key" => $this->data_store->getClientV4APIKey(),
            "X-Auth-Email" => $this->data_store->getCloudFlareEmail(),
            self::CONTENT_TYPE_KEY => self::APPLICATION_JSON_KEY
        );
        $request->setHeaders($headers);

        return $request;
    }

    /**
     * @param $message
     * @return array
     */
    public function createAPIError($message)
    {
        $this->logger->error($message);
        return array(
            'result' => null,
            'success' => false,
            'errors' => array(
                array(
                    'code' => '',
                    'message' => $message,
                )
            ),
            'messages' => array()
        );
    }

    /**
     * @param $response
     * @return bool
     */
    public function responseOk($response)
    {
        return ($response["success"] === true);
    }

    /**
     * @return string
     */
    public function getEndpoint()
    {
        return self::ENDPOINT;
    }

    /**
     * @return string
     */
    public function getAPIClientName()
    {
        return self::CLIENT_API_NAME;
    }

    /**
     * GET /zones/:id
     * @param $zone_tag
     * @return string
     */
    public function zoneGetDetails($zone_tag)
    {
        $request = new Request("GET", "zones/" . $zone_tag, array(), array());
        return $this->callAPI($request);
    }
}
