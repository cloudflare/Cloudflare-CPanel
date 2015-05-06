#!/usr/local/cpanel/3rdparty/bin/php -q
<?php
// file - /usr/local/cpanel/3rdparty/bin/cloudflare/default-on.php
global $input;
ini_set('display_errors', 1);
ini_set('error_reporting', E_ALL);

require_once "/usr/local/cpanel/php/cpanel.php";

// Any switches passed to this script, which are set in describe
$switches = (count($argv) > 1) ? $argv : array();

// Information on the account is sent from cPanel through stdin
if (in_array('--debug', $switches)) {
    $input = file_get_contents(dirname(__FILE__) . '/debug.txt');
} else {
    $input = file_get_contents("php://stdin");
}

// TODO: Clean up debug information
file_put_contents(dirname(__FILE__) . '/test.txt', print_r($switches, true) . "\n\n" . print_r($input, true));

if (in_array('--describe', $switches)) {
    echo json_encode( describe() );
    exit;
} elseif (in_array('--add', $switches)) {
    list($status, $msg) = add();
    echo "$status $msg\n";
    exit;
} elseif (in_array('--remove', $switches)) {
    list($status, $msg) = remove();
    echo "$status $msg\n";
    exit;
} else {
    echo '0 cloudflare/default-on.php needs a valid switch';
    exit(1);
}

function describe() {
    $my_add = array(
        'category' => 'Whostmgr',
        'event'    => 'Accounts::Create',
        'stage'    => 'post',
        'hook'     => '/usr/local/cpanel/3rdparty/bin/cloudflare/default-on.php --add',
        'exectype' => 'script',
    );
    $my_remove = array(
        'blocking' => 1,
        'category' => 'Whostmgr',
        'event'    => 'Accounts::Remove',
        'stage'    => 'pre',
        'hook'     => '/usr/local/cpanel/3rdparty/bin/cloudflare/default-on.php --remove',
        'exectype' => 'script',
    );
    return array($my_add, $my_remove);
}

function get_input() {
    global $input;

    return json_decode($input);
}

/**
 * @param $userid int
 * @param $action string
 * @param $data array
 * @throws Exception
 * @returns stdClass
 */
function call_cfadmin($userid, $action, $data = array()) {
    if (!is_int($userid)) {
        throw new Exception('Invalid userid passed to `call_cfadmin`');
    }

    if (!is_string($action) || !$action) {
        throw new Exception('Invalid action passed to `call_cfadmin`');
    }

    if (!is_array($data)) {
        throw new Exception('Invalid data passed to `call_cfadmin`');
    }

    $stdin = "$userid $action ";
    foreach ($data as $key => $value) {
        $stdin .= "$key $value ";
    }

    $descriptorspec = array(
        0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
        1 => array("pipe", "w")  // stdout is a pipe that the child will write to
    );

    $process = proc_open("/usr/local/cpanel/bin/cfadmin", $descriptorspec, $pipes);

    if (!is_resource($process)) {
        throw new Exception('Unable to open process to cfadmin');
    }

    // write necessary data to cfadmin for it to run
    fwrite($pipes[0], $stdin . "\n");
    fclose($pipes[0]);

    $response = stream_get_contents($pipes[1]);
    fclose($pipes[1]);

    $return_value = proc_close($process);

    if ($return_value !== 0) {
        throw new Exception('Error code returned from cfadmin');
    }

    // try to parse out the javascript response
    // cfadmin adds a period on its own line to make cpanel happy, so we need to trim that off to get valid json.
    $json_string = trim($response, ". \t\n\r");

    $response_object = json_decode($json_string);

    return $response_object;
}

function add() {
    $data = get_input();

    $username = $data->data->user;
    $domain = $data->data->domain;
    $user_key = null;

    // grab the userid, since we will need this to proceed
    exec('id -u ' . $username, $response);
    $user_id = (int)$response[0];

    // check if host is already authorized to work on behalf of this user
    $params = array(
        "user" => $data->data->user,
        "homedir" => $data->data->homedir
    );
    $response = call_cfadmin($user_id, "user_lookup", $params);

    if (!isset($response->result)) {
        return array(1001, "Error communicating with CloudFlare");
    }

    if (isset($response->response->user_key)) {
        $user_key = $response->response->user_key;
    }

    if (!$user_key) {
        // try to create the user, since the user doesn't have access to the user
        $params   = array(
            "email" => $data->data->contactemail,
            "password" => '', // always try to create the account if it doesn't exist
            "user" => $data->data->user,
            "homedir" => $data->data->homedir
        );
        $response = call_cfadmin($user_id, "user_create", $params);

        if ($response->result !== "success") {
            return array(1002, "Failed to create user");
        }

        // if we don't have a user_key, we have to stop. No CloudFlare account to add the domain to.
        if (isset($response->response->user_key)) {
            $user_key = $response->response->user_key;
        } else {
            return array(1003, "CloudFlare response did not contain a user key");
        }
    }

    // We have a valid user account, so let's add the domain
    $params   = array(
        "subdomains" => "www." . $domain,
        "user_key" => $user_key,
        "zone_name" => $domain,
        "homedir" => $data->data->homedir
    );
    $response = call_cfadmin($user_id, "zone_set", $params);

    if ($response->result !== "success") {
        return array(1004, isset($response->msg) ? $response->msg : "An unknown error occured while setting up the domain");
    }


    return array(200, "Success! CloudFlare has been setup for $username on $domain");
}

function remove() {
    // Currently no action taken on removal
    return array(200, "Success!");
}
