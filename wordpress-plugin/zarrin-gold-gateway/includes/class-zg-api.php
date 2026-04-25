<?php
/**
 * Zarrin Gold — API Client
 *
 * Handles all HTTP communication with the Zarrin Gold gateway server.
 */

if (!defined('ABSPATH')) {
    exit;
}

class ZG_API
{
    /** @var string */
    private $api_key;

    /** @var string */
    private $api_base;

    /** @var bool */
    private $debug;

    /** @var int */
    private $timeout = 30;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->api_key = get_option('zg_api_key', '');
        $this->api_base = rtrim(get_option('zg_api_base', ''), '/');
        $this->debug   = get_option('zg_debug_mode', 'no') === 'yes';

        // Fallback: use ZG_API_BASE constant if option is empty
        if (empty($this->api_base) && defined('ZG_API_BASE')) {
            $this->api_base = ZG_API_BASE;
        }
    }

    /**
     * Check if gateway is properly configured
     */
    public function is_configured(): bool
    {
        return !empty($this->api_key) && !empty($this->api_base);
    }

    /**
     * Create a payment request
     *
     * @param array $params {
     *     @type float  $amount        Amount in toman (for gold mode, will be converted server-side)
     *     @type string $currency      'toman' | 'gold' | 'mixed'
     *     @type float  $amount_gold   Gold grams (when currency = gold)
     *     @type string $callback_url  Return URL after payment
     *     @type string $description   Payment description
     *     @type string $customer_name Customer name
     *     @type string $customer_phone Customer phone
     *     @type string $customer_email Customer email
     *     @type string $order_id      Merchant order number (stored in metadata)
     * }
     * @return array|WP_Error {
     *     @type string $authority   Payment token
     *     @type string $payment_url Full checkout URL
     *     @type float  $amount_toman
     *     @type float  $gold_grams
     *     @type float  $fee_toman
     *     @type float  $fee_gold
     * }
     */
    public function create_payment(array $params)
    {
        $body = array_merge([
            'api_key'       => $this->api_key,
            'amount'        => 0,
            'currency'      => get_option('zg_payment_mode', 'gold'),
            'payment_method'=> get_option('zg_payment_mode', 'gold'),
            'description'   => '',
            'metadata'      => new stdClass(),
        ], $params);

        return $this->request('POST', '/api/v1/payment/request', $body);
    }

    /**
     * Verify a payment
     *
     * @param string $authority Payment authority token
     * @param string $status   'OK' to confirm, 'NOK' to cancel
     * @return array|WP_Error
     */
    public function verify_payment(string $authority, string $status = 'OK')
    {
        $body = [
            'authority' => $authority,
            'status'    => $status,
        ];

        return $this->request('POST', '/api/v1/payment/verify', $body);
    }

    /**
     * Get payment details
     *
     * @param string $authority
     * @return array|WP_Error
     */
    public function get_payment(string $authority)
    {
        return $this->request('GET', '/api/checkout/' . urlencode($authority));
    }

    /**
     * Get live gold price
     *
     * @return array|WP_Error {
     *     @type float $buyPrice
     *     @type float $sellPrice
     *     @type float $marketPrice
     * }
     */
    public function get_gold_price()
    {
        return $this->request('GET', '/api/gold/prices');
    }

    /**
     * Get payment history
     *
     * @param array $params Query params (status, page, limit, etc.)
     * @return array|WP_Error
     */
    public function get_history(array $params = [])
    {
        $query = http_build_query(array_merge([
            'api_key' => $this->api_key,
            'limit'   => 20,
            'page'    => 1,
        ], $params));

        return $this->request('GET', '/api/v1/payment/history?' . $query);
    }

    /**
     * Refund a payment
     *
     * @param string $authority
     * @param float  $amount   Refund amount
     * @param string $reason   Reason text
     * @return array|WP_Error
     */
    public function refund_payment(string $authority, float $amount, string $reason = '')
    {
        return $this->request('POST', '/api/v1/payment/refund', [
            'api_key'   => $this->api_key,
            'authority' => $authority,
            'amount'    => $amount,
            'reason'    => $reason,
        ]);
    }

    /**
     * Verify webhook signature
     *
     * @param string $payload   Raw JSON body
     * @param string $signature X-ZarrinGold-Signature header value
     * @return bool
     */
    public function verify_webhook(string $payload, string $signature): bool
    {
        $secret = get_option('zg_webhook_secret', '');
        if (empty($secret)) {
            return false;
        }
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $signature);
    }

    /**
     * Make HTTP request to gateway API
     *
     * @param string $method   HTTP method
     * @param string $endpoint API endpoint path
     * @param array  $body     Request body (for POST/PUT)
     * @return array|WP_Error  Decoded JSON response or error
     */
    private function request(string $method, string $endpoint, array $body = [])
    {
        $url = $this->api_base . $endpoint;

        ZG_Logger::log("API Request: {$method} {$url}", $body);

        $args = [
            'timeout'    => $this->timeout,
            'headers'    => [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
            'sslverify'  => true,
            'user-agent' => 'ZarrinGold-WP/' . ZARRIN_GOLD_VERSION . '; WooCommerce/' . WC_VERSION . '; ' . home_url(),
        ];

        if (in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'])) {
            $args['body'] = wp_json_encode($body);
            $args['method'] = strtoupper($method);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            ZG_Logger::log('API Error: ' . $response->get_error_message(), null, 'error');
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        $resp_body = wp_remote_retrieve_body($response);
        $data = json_decode($resp_body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            ZG_Logger::log('API JSON Error: ' . json_last_error_msg(), $resp_body, 'error');
            return new WP_Error('zg_json_error', __('خطا در پردازش پاسخ سرور', 'zarrin-gold-gateway'));
        }

        ZG_Logger::log("API Response: {$code}", $data);

        if ($code < 200 || $code >= 300) {
            $message = $data['error'] ?? $data['message'] ?? sprintf(__('خطای سرور (کد %d)', 'zarrin-gold-gateway'), $code);
            return new WP_Error('zg_api_error', $message, ['code' => $code, 'data' => $data]);
        }

        return $data;
    }
}
