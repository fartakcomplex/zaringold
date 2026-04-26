<?php
/**
 * Zarrin Gold — WooCommerce Payment Gateway
 *
 * The main gateway class that integrates with WooCommerce checkout.
 */

if (!defined('ABSPATH')) {
    exit;
}

class ZG_Gateway extends WC_Payment_Gateway
{
    /** @var ZG_API */
    private $api;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->id                 = 'zarrin_gold';
        $this->icon               = apply_filters('zg_gateway_icon', ZARRIN_GOLD_PLUGIN_URL . 'assets/gold-icon.svg');
        $this->has_fields         = false;
        $this->method_title       = __('درگاه طلایی زرین گلد', 'zarrin-gold-gateway');
        $this->method_description = __('پذیرش پرداخت بر اساس گرم طلا — بدون ریال و تومان', 'zarrin-gold-gateway');
        $this->supports           = [
            'products',
            'refunds',
        ];

        $this->init_form_fields();
        $this->init_settings();

        // Load saved settings
        foreach ($this->settings as $key => $value) {
            if (property_exists($this, $key)) {
                $this->$key = $value;
            }
        }

        $this->title       = $this->get_option('title', __('پرداخت با طلا (زرین گلد)', 'zarrin-gold-gateway'));
        $this->description = $this->get_option('description', __('پرداخت امن و سریع بر اساس گرم طلا', 'zarrin-gold-gateway'));

        $this->api = new ZG_API();

        // Save settings hook
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);

        // Webhook endpoint
        add_action('woocommerce_api_zg_webhook', [$this, 'handle_webhook']);

        // Return from payment page
        add_action('woocommerce_api_zg_return', [$this, 'handle_return']);

        // Gold price display on checkout
        add_action('woocommerce_review_order_before_payment', [$this, 'display_gold_equivalent']);
    }

    /**
     * Form fields for admin settings
     */
    public function init_form_fields()
    {
        $this->form_fields = [
            'enabled' => [
                'title'   => __('فعال / غیرفعال', 'zarrin-gold-gateway'),
                'type'    => 'checkbox',
                'label'   => __('فعال‌سازی درگاه زرین گلد', 'zarrin-gold-gateway'),
                'default' => 'no',
            ],
            'title' => [
                'title'       => __('عنوان درگاه', 'zarrin-gold-gateway'),
                'type'        => 'text',
                'description' => __('عنوانی که در صفحه پرداخت نمایش داده می‌شود', 'zarrin-gold-gateway'),
                'default'     => __('پرداخت با طلا (زرین گلد)', 'zarrin-gold-gateway'),
                'desc_tip'    => true,
            ],
            'description' => [
                'title'       => __('توضیحات', 'zarrin-gold-gateway'),
                'type'        => 'textarea',
                'description' => __('توضیحی که در صفحه پرداخت نمایش داده می‌شود', 'zarrin-gold-gateway'),
                'default'     => __('پرداخت امن و سریع بر اساس گرم طلا', 'zarrin-gold-gateway'),
            ],
            'api_key' => [
                'title'       => __('کلید API', 'zarrin-gold-gateway'),
                'type'        => 'text',
                'description' => __('کلید API دریافتی از پنل فروشندگان زرین گلد (مثال: gp_live_abc123...)', 'zarrin-gold-gateway'),
                'desc_tip'    => true,
            ],
            'api_base' => [
                'title'       => __('آدرس سرور API', 'zarrin-gold-gateway'),
                'type'        => 'text',
                'description' => __('آدرس پایه سرور زرین گلد (بدون / در انتها)', 'zarrin-gold-gateway'),
                'default'     => '',
                'desc_tip'    => true,
            ],
            'payment_mode' => [
                'title'       => __('حالت پرداخت', 'zarrin-gold-gateway'),
                'type'        => 'select',
                'description' => __('نحوه پرداخت مشتریان را تعیین کنید', 'zarrin-gold-gateway'),
                'options'     => [
                    'gold'  => __('فقط طلا 💰', 'zarrin-gold-gateway'),
                    'toman' => __('فقط تومان 💵', 'zarrin-gold-gateway'),
                    'mixed' => __('ترکیبی (طلا + تومان)', 'zarrin-gold-gateway'),
                ],
                'default'     => 'gold',
            ],
            'gold_percent' => [
                'title'       => __('درصد طلا (حالت ترکیبی)', 'zarrin-gold-gateway'),
                'type'        => 'number',
                'description' => __('در حالت ترکیبی، چه درصد از مبلغ با طلا پرداخت شود', 'zarrin-gold-gateway'),
                'default'     => '50',
                'custom_attributes' => ['min' => '1', 'max' => '99'],
            ],
            'order_status' => [
                'title'       => __('وضعیت سفارش بعد پرداخت', 'zarrin-gold-gateway'),
                'type'        => 'select',
                'options'     => wc_get_order_statuses(),
                'default'     => 'wc-processing',
            ],
            'webhook_secret' => [
                'title'       => __('رمز وب‌هوک', 'zarrin-gold-gateway'),
                'type'        => 'text',
                'description' => __('برای تأیید اعتبار وب‌هوک‌ها استفاده می‌شود', 'zarrin-gold-gateway'),
                'custom_attributes' => ['readonly' => 'readonly'],
            ],
            'debug_mode' => [
                'title'       =>__('حالت عیب‌یابی', 'zarrin-gold-gateway'),
                'type'        => 'checkbox',
                'label'       => __('فعال‌سازی لاگ‌گیری', 'zarrin-gold-gateway'),
                'description' => __('تمام درخواست‌ها و پاسخ‌ها لاگ می‌شوند', 'zarrin-gold-gateway'),
                'default'     => 'no',
            ],
        ];
    }

    /**
     * Process checkout payment
     *
     * @param int $order_id WooCommerce order ID
     * @return array redirect URL
     */
    public function process_payment($order_id)
    {
        $order = wc_get_order($order_id);

        if (!$order) {
            wc_add_notice(__('سفارش پیدا نشد', 'zarrin-gold-gateway'), 'error');
            return;
        }

        // Check gateway is configured
        if (!$this->api->is_configured()) {
            wc_add_notice(__('درگاه پرداخت تنظیم نشده. لطفاً با مدیریت تماس بگیرید.', 'zarrin-gold-gateway'), 'error');
            return;
        }

        $amount   = (float) $order->get_total();
        $currency = $order->get_currency();

        // Build callback URLs
        $return_url = add_query_arg([
            'wc_order'    => $order_id,
            'wc_order_key' => $order->get_order_key(),
        ], home_url('/wc-api/zg_return'));

        $mode = $this->get_option('payment_mode', 'gold');

        // Prepare payment params
        $params = [
            'amount'        => $amount,
            'currency'      => $mode === 'gold' ? 'gold' : 'toman',
            'payment_method'=> $mode,
            'callback_url'  => $return_url,
            'description'   => sprintf(
                /* translators: %s: order number */
                __('سفارش #%s - %s', 'zarrin-gold-gateway'),
                $order->get_order_number(),
                wp_parse_url(home_url(), PHP_URL_HOST)
            ),
            'customer_name'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
            'customer_phone' => $order->get_billing_phone(),
            'customer_email' => $order->get_billing_email(),
            'metadata'       => [
                'order_id'      => (string) $order_id,
                'order_key'     => $order->get_order_key(),
                'order_number'  => $order->get_order_number(),
                'site_url'      => home_url(),
                'wc_version'    => WC_VERSION,
            ],
        ];

        ZG_Logger::log('Creating payment for order #' . $order_id, $params);

        // Create payment on gateway
        $result = $this->api->create_payment($params);

        if (is_wp_error($result)) {
            $error_msg = $result->get_error_message();
            ZG_Logger::log('Payment creation failed: ' . $error_msg, null, 'error');
            wc_add_notice(sprintf(__('خطا در اتصال به درگاه: %s', 'zarrin-gold-gateway'), $error_msg), 'error');
            return;
        }

        if (empty($result['success']) || empty($result['data']['authority'])) {
            $error = $result['error'] ?? __('خطای ناشناخته از سرور درگاه', 'zarrin-gold-gateway');
            ZG_Logger::log('Payment API error', $result, 'error');
            wc_add_notice(sprintf(__('خطا از سرور درگاه: %s', 'zarrin-gold-gateway'), $error), 'error');
            return;
        }

        $data = $result['data'];

        // Save payment info to order
        $order->update_meta_data('_zg_authority', sanitize_text_field($data['authority']));
        $order->update_meta_data('_zg_payment_url', esc_url_raw($data['payment_url']));
        $order->update_meta_data('_zg_amount_toman', floatval($data['amount_toman'] ?? 0));
        $order->update_meta_data('_zg_gold_grams', floatval($data['gold_grams'] ?? 0));
        $order->update_meta_data('_zg_payment_method', sanitize_text_field($data['payment_method'] ?? $mode));
        $order->update_meta_data('_zg_status', 'pending');
        $order->save();

        // Update order status
        $order->update_status('pending', __('در انتظار پرداخت زرین گلد', 'zarrin-gold-gateway'));

        ZG_Logger::log('Payment created. Authority: ' . $data['authority'], $data);

        // Build full payment URL
        $payment_url = $data['payment_url'];
        if (strpos($payment_url, 'http') !== 0) {
            // Relative URL — prepend gateway base
            $payment_url = rtrim(get_option('zg_api_base', ''), '/') . $payment_url;
        }

        return [
            'result'   => 'success',
            'redirect' => $payment_url,
        ];
    }

    /**
     * Handle return from payment page
     */
    public function handle_return()
    {
        $authority = sanitize_text_field($_GET['authority'] ?? '');
        $status    = sanitize_text_field($_GET['status'] ?? '');
        $order_id  = absint($_GET['wc_order'] ?? 0);
        $order_key = sanitize_text_field($_GET['wc_order_key'] ?? '');

        ZG_Logger::log('Return callback received', [
            'authority' => $authority,
            'status'    => $status,
            'order_id'  => $order_id,
        ]);

        if (empty($authority) || empty($order_id)) {
            wp_die(__('پارامترهای ناقص از درگاه دریافت شد.', 'zarrin-gold-gateway'));
        }

        $order = wc_get_order($order_id);

        if (!$order || !$order->key_is_valid($order_key)) {
            wp_die(__('سفارش معتبر نیست.', 'zarrin-gold-gateway'));
        }

        // Check if already processed via webhook
        $existing_status = $order->get_meta('_zg_status');
        if ($existing_status === 'paid') {
            wp_redirect($this->get_return_url($order));
            exit;
        }

        // Verify payment with gateway
        $result = $this->api->verify_payment($authority, $status === 'cancel' ? 'NOK' : 'OK');

        if (is_wp_error($result)) {
            ZG_Logger::log('Verify error: ' . $result->get_error_message(), null, 'error');
            $order->update_status('failed', __('خطا در تأیید پرداخت از درگاه', 'zarrin-gold-gateway'));
            wc_add_notice(__('پرداخت تأیید نشد. لطفاً دوباره تلاش کنید.', 'zarrin-gold-gateway'), 'error');
            wp_redirect(wc_get_checkout_url());
            exit;
        }

        if (!empty($result['success']) && !empty($result['data']['ref_id'])) {
            $this->complete_payment($order, $result['data']);
        } else {
            $order->update_status('failed', __('پرداخت ناموفق یا لغو شده', 'zarrin-gold-gateway'));
            wc_add_notice(__('پرداخت انجام نشد.', 'zarrin-gold-gateway'), 'error');
        }

        wp_redirect($this->get_return_url($order));
        exit;
    }

    /**
     * Handle webhook from gateway
     */
    public function handle_webhook()
    {
        // Read raw body
        $payload    = file_get_contents('php://input');
        $signature  = $_SERVER['HTTP_X_ZARRINGOLD_SIGNATURE'] ?? $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

        ZG_Logger::log('Webhook received', ['signature' => $signature, 'payload' => $payload]);

        // Verify signature
        if (!$this->api->verify_webhook($payload, $signature)) {
            ZG_Logger::log('Webhook signature verification failed', null, 'error');
            status_header(403);
            echo json_encode(['error' => 'Invalid signature']);
            exit;
        }

        $data = json_decode($payload, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            status_header(400);
            echo json_encode(['error' => 'Invalid JSON']);
            exit;
        }

        $event     = $data['event'] ?? '';
        $authority = $data['authority'] ?? '';

        // Process webhook events
        if (strpos($event, 'payment.success') !== false || strpos($event, 'payment.verified') !== false) {
            if (!empty($authority)) {
                $this->process_webhook_payment($authority, $data);
            }
        }

        status_header(200);
        echo json_encode(['status' => 'ok']);
        exit;
    }

    /**
     * Process a webhook payment notification
     */
    private function process_webhook_payment(string $authority, array $data): void
    {
        // Find order by authority
        $orders = wc_get_orders([
            'limit'      => 1,
            'meta_key'   => '_zg_authority',
            'meta_value' => $authority,
        ]);

        if (empty($orders)) {
            ZG_Logger::log('Webhook: Order not found for authority: ' . $authority);
            return;
        }

        $order = $orders[0];

        // Already paid?
        if ($order->get_meta('_zg_status') === 'paid') {
            ZG_Logger::log('Webhook: Order already paid #' . $order->get_id());
            return;
        }

        $this->complete_payment($order, $data['data'] ?? $data);
    }

    /**
     * Mark order as paid and complete
     */
    private function complete_payment(WC_Order $order, array $payment_data): void
    {
        $ref_id = $payment_data['ref_id'] ?? $payment_data['authority'] ?? 'N/A';

        $order->update_meta_data('_zg_status', 'paid');
        $order->update_meta_data('_zg_ref_id', sanitize_text_field($ref_id));
        $order->update_meta_data('_zg_paid_gold', floatval($payment_data['paid_gold'] ?? 0));
        $order->update_meta_data('_zg_card_pan', sanitize_text_field($payment_data['card_pan'] ?? ''));
        $order->update_meta_data('_zg_verified_at', current_time('mysql'));

        // Update order status
        $target_status = $this->get_option('order_status', 'wc-processing');
        $order->update_status($target_status, sprintf(
            /* translators: %s: reference ID */
            __('پرداخت با طلا تأیید شد — کد رهگیری: %s', 'zarrin-gold-gateway'),
            $ref_id
        ));

        // Save gold transaction details
        $paid_gold = floatval($payment_data['paid_gold'] ?? 0);
        if ($paid_gold > 0) {
            $order->add_order_note(sprintf(
                /* translators: %s: gold grams */
                __('مبلغ پرداختی: %s گرم طلا', 'zarrin-gold-gateway'),
                number_format_i18n($paid_gold, 3)
            ));
        }

        // Reduce stock
        $order->reduce_order_stock();

        ZG_Logger::log('Payment completed for order #' . $order->get_id(), $payment_data);
    }

    /**
     * Process refund
     *
     * @param int    $order_id
     * @param float  $amount
     * @param string $reason
     * @return bool|WP_Error
     */
    public function process_refund($order_id, $amount = null, $reason = '')
    {
        $order = wc_get_order($order_id);

        if (!$order) {
            return new WP_Error('zg_refund_error', __('سفارش پیدا نشد', 'zarrin-gold-gateway'));
        }

        $authority = $order->get_meta('_zg_authority');
        if (empty($authority)) {
            return new WP_Error('zg_refund_error', __('اطلاعات پرداخت یافت نشد', 'zarrin-gold-gateway'));
        }

        if ($amount === null) {
            $amount = (float) $order->get_total();
        }

        $result = $this->api->refund_payment($authority, $amount, $reason);

        if (is_wp_error($result)) {
            return $result;
        }

        $order->add_order_note(sprintf(
            /* translators: %s: refund amount */
            __('بازگشت وجه %s به درگاه زرین گلد انجام شد', 'zarrin-gold-gateway'),
            wc_price($amount)
        ));

        return true;
    }

    /**
     * Display gold equivalent amount on checkout page
     */
    public function display_gold_equivalent(): void
    {
        $available_gateways = WC()->payment_gateways()->get_available_payment_gateways();

        if (!isset($available_gateways[$this->id])) {
            return;
        }

        $mode = $this->get_option('payment_mode', 'gold');

        if ($mode === 'toman') {
            return;
        }

        // Get gold price
        $price_data = $this->api->get_gold_price();

        if (is_wp_error($price_data) || empty($price_data['buyPrice'])) {
            return;
        }

        $gold_price = floatval($price_data['buyPrice']);
        $cart_total = (float) WC()->cart->get_total('raw');
        $gold_grams = $gold_price > 0 ? $cart_total / $gold_price : 0;

        if ($gold_grams <= 0) {
            return;
        }

        // Format gold display
        $gold_text = '';
        if ($gold_grams >= 1) {
            $gold_text = number_format_i18n($gold_grams, 3) . ' ' . __('گرم طلا', 'zarrin-gold-gateway');
        } else {
            $gold_mg  = $gold_grams * 1000;
            $gold_text = number_format_i18n($gold_mg, 1) . ' ' . __('میلی‌گرم طلا', 'zarrin-gold-gateway');
        }

        ?>
        <div class="zg-gold-notice" style="
            background: linear-gradient(135deg, #D4AF37 0%, #F0D060 100%);
            color: #1a1a1a;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 600;
        ">
            <span style="font-size: 20px;">💰</span>
            <span>
                <?php
                printf(
                    /* translators: %s: gold amount in grams/mg */
                    __('معادل %s', 'zarrin-gold-gateway'),
                    esc_html($gold_text)
                );
                ?>
            </span>
            <span style="margin-right: auto; font-size: 11px; opacity: 0.7;">
                <?php esc_html_e('قیمت لحظه‌ای: ', 'zarrin-gold-gateway'); ?>
                <?php echo number_format_i18n($gold_price); ?>
            </span>
        </div>
        <?php
    }
}
