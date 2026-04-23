<?php
/**
 * Plugin Name: درگاه پرداخت طلای زرین گلد
 * Plugin URI: https://zarringold.com
 * Description: درگاه پرداخت آنلاین بر پایه طلای دیجیتال برای ووکامرس. مشتریان شما می‌توانند سفارشات خود را مستقیماً با طلای دیجیتال از کیف پول زرین گلد پرداخت کنند.
 * Version: 1.0.0
 * Author: Zarrin Gold
 * Author URI: https://zarringold.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: zarrin-gold-gateway
 * Domain Path: /languages
 * Requires at least: 5.5
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 9.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Activation / Deactivation Hooks
 * ─────────────────────────────────────────────────────────────────────────────
 */
register_activation_hook( __FILE__, 'zarrin_gold_activate' );
function zarrin_gold_activate() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        deactivate_plugins( plugin_basename( __FILE__ ) );
        wp_die(
            '<p>' . esc_html__( 'برای فعال‌سازی این افزونه ابتدا ووکامرس را نصب و فعال کنید.', 'zarrin-gold-gateway' ) . '</p>',
            __( 'پیش‌نیاز برآورده نشده', 'zarrin-gold-gateway' ),
            array( 'back_link' => true )
        );
    }
    // Initialise webhook log option
    if ( false === get_option( 'zarrin_gold_webhook_log' ) ) {
        update_option( 'zarrin_gold_webhook_log', array() );
    }
}

register_deactivation_hook( __FILE__, 'zarrin_gold_deactivate' );
function zarrin_gold_deactivate() {
    // Optionally clean up — uncomment to remove options on deactivation
    // delete_option( 'woocommerce_zarrin_gold_settings' );
    // delete_option( 'zarrin_gold_webhook_log' );
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Bootstrap — register gateway after WooCommerce is fully loaded
 * ─────────────────────────────────────────────────────────────────────────────
 */
add_action( 'plugins_loaded', 'zarrin_gold_init_gateway_class', 11 );
function zarrin_gold_init_gateway_class() {

    if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
        return;
    }

    // ─── Text domain ─────────────────────────────────────────────────────
    load_plugin_textdomain( 'zarrin-gold-gateway', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

    // ─── Main Gateway Class ──────────────────────────────────────────────
    class WC_Zarrin_Gold_Gateway extends WC_Payment_Gateway {

        /** @var string Gateway version */
        const VERSION = '1.0.0';

        /** @var string Option key for webhook log */
        const WEBHOOK_LOG_KEY = 'zarrin_gold_webhook_log';

        /** @var int Max webhook log entries to keep */
        const WEBHOOK_LOG_MAX = 10;

        /** ──────────────────────────────────────────────────────────────── */

        /**
         * Constructor
         */
        public function __construct() {
            $this->id                 = 'zarrin_gold';
            $this->method_title       = __( 'درگاه پرداخت طلای زرین گلد', 'zarrin-gold-gateway' );
            $this->method_description = __( 'پرداخت از طریق کیف پول طلای زرین گلد. مشتریان می‌توانند با طلای دیجیتال پرداخت کنند.', 'zarrin-gold-gateway' );
            $this->has_fields         = false;
            $this->init_form_fields();
            $this->init_settings();

            // Title & description shown at checkout
            $this->title       = $this->get_option( 'title', __( 'پرداخت با طلای زرین گلد', 'zarrin-gold-gateway' ) );
            $this->description = $this->get_option( 'description', __( 'پرداخت امن و سریع با طلای دیجیتال از کیف پول زرین گلد خود.', 'zarrin-gold-gateway' ) );
            $this->icon        = $this->get_gold_coin_svg();

            // Store admin API keys
            $this->api_key    = $this->get_option( 'api_key' );
            $this->api_secret = $this->get_option( 'api_secret' );
            $this->gateway_url = rtrim( $this->get_option( 'gateway_url', 'https://zarringold.com' ), '/' );
            $this->payment_mode = $this->get_option( 'payment_mode', 'fiat_amount' );
            $this->gold_price   = (float) $this->get_option( 'gold_price', 0 );
            $this->order_status = $this->get_option( 'order_status', 'processing' );
            $this->debug_mode   = 'yes' === $this->get_option( 'debug_mode', 'no' );

            // Callback / webhook URL (auto-generated)
            $this->webhook_url = add_query_arg( 'wc_zarrin_callback', '1', home_url( '/' ) );

            // Save settings
            add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );

            // Register callback endpoint
            add_action( 'init', array( $this, 'register_callback_endpoint' ) );

            // AJAX: test connection
            add_action( 'wp_ajax_zarrin_gold_test_connection', array( $this, 'ajax_test_connection' ) );

            // AJAX: clear webhook log
            add_action( 'wp_ajax_zarrin_gold_clear_log', array( $this, 'ajax_clear_log' ) );
        }

        /* ──────────────────────────────────────────────────────────────────
         * SVG Icon (inline gold coin)
         * ────────────────────────────────────────────────────────────────── */
        private function get_gold_coin_svg() {
            $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'
                 . '<defs><linearGradient id="zg" x1="0%" y1="0%" x2="100%" y2="100%">'
                 . '<stop offset="0%" style="stop-color:#FFD700;stop-opacity:1"/>'
                 . '<stop offset="50%" style="stop-color:#FFA500;stop-opacity:1"/>'
                 . '<stop offset="100%" style="stop-color:#DAA520;stop-opacity:1"/>'
                 . '</linearGradient></defs>'
                 . '<circle cx="24" cy="24" r="22" fill="url(#zg)" stroke="#B8860B" stroke-width="2"/>'
                 . '<circle cx="24" cy="24" r="17" fill="none" stroke="#B8860B" stroke-width="1" opacity="0.5"/>'
                 . '<text x="24" y="30" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#5C3D00" text-anchor="middle">ZG</text>'
                 . '</svg>';
            return 'data:image/svg+xml;base64,' . base64_encode( $svg );
        }

        /* ──────────────────────────────────────────────────────────────────
         * Admin Form Fields
         * ────────────────────────────────────────────────────────────────── */
        public function init_form_fields() {
            $webhook_url = add_query_arg( 'wc_zarrin_callback', '1', home_url( '/' ) );

            $this->form_fields = array(

                /* ── Section: Enabled ─────────────────────────────────────── */
                'enabled' => array(
                    'title'   => __( 'فعال‌سازی', 'zarrin-gold-gateway' ),
                    'type'    => 'checkbox',
                    'label'   => __( 'فعال‌سازی درگاه پرداخت زرین گلد', 'zarrin-gold-gateway' ),
                    'default' => 'no',
                ),
                'title' => array(
                    'title'       => __( 'عنوان درگاه', 'zarrin-gold-gateway' ),
                    'type'        => 'text',
                    'description' => __( 'عنوانی که مشتری در صفحه پرداخت می‌بیند.', 'zarrin-gold-gateway' ),
                    'default'     => __( 'پرداخت با طلای زرین گلد', 'zarrin-gold-gateway' ),
                    'desc_tip'    => true,
                ),
                'description' => array(
                    'title'       => __( 'توضیحات درگاه', 'zarrin-gold-gateway' ),
                    'type'        => 'textarea',
                    'description' => __( 'توضیحاتی که زیر عنوان درگاه در صفحه پرداخت نمایش داده می‌شود.', 'zarrin-gold-gateway' ),
                    'default'     => __( 'پرداخت امن و سریع با طلای دیجیتال از کیف پول زرین گلد خود.', 'zarrin-gold-gateway' ),
                ),

                /* ── Section: API Credentials ────────────────────────────── */
                'api_key' => array(
                    'title'       => __( 'کلید API (API Key)', 'zarrin-gold-gateway' ),
                    'type'        => 'text',
                    'description' => __( 'کلید API را از پنل تاجر زرین گلد دریافت کنید.', 'zarrin-gold-gateway' ),
                    'desc_tip'    => true,
                ),
                'api_secret' => array(
                    'title'       => __( 'رمز API (API Secret)', 'zarrin-gold-gateway' ),
                    'type'        => 'password',
                    'description' => __( 'رمز API را از پنل تاجر زرین گلد دریافت کنید.', 'zarrin-gold-gateway' ),
                    'desc_tip'    => true,
                ),
                'gateway_url' => array(
                    'title'       => __( 'آدرس درگاه (Gateway URL)', 'zarrin-gold-gateway' ),
                    'type'        => 'text',
                    'default'     => 'https://zarringold.com',
                    'description' => __( 'آدرس پایه درگاه زرین گلد (بدون اسلش انتهایی).', 'zarrin-gold-gateway' ),
                    'desc_tip'    => true,
                ),
                'webhook_info' => array(
                    'title'       => __( 'آدرس بازگشت (Webhook URL)', 'zarrin-gold-gateway' ),
                    'type'        => 'webhook_info',
                    /* Custom field — rendered by generate_webhook_info_html() */
                ),

                /* ── Section: Payment Settings ────────────────────────────── */
                'payment_mode' => array(
                    'title'       => __( 'حالت پرداخت', 'zarrin-gold-gateway' ),
                    'type'        => 'select',
                    'options'     => array(
                        'fiat_amount' => __( 'تبدیل مبلغ ریالی به طلای دیجیتال', 'zarrin-gold-gateway' ),
                        'gold_amount' => __( 'پرداخت مستقیم با طلای دیجیتال (گرم)', 'zarrin-gold-gateway' ),
                    ),
                    'description' => __( 'در حالت ریالی، مبلغ سفارش بر اساس قیمت فعلی طلا به گرم تبدیل می‌شود.', 'zarrin-gold-gateway' ),
                    'desc_tip'    => true,
                    'default'     => 'fiat_amount',
                ),
                'gold_price' => array(
                    'title'       => __( 'قیمت طلا (تومان به ازای هر گرم)', 'zarrin-gold-gateway' ),
                    'type'        => 'number',
                    'description' => sprintf(
                        /* translators: %s: placeholder text */
                        __( 'قیمت فعلی طلای ۱۸ عیار به تومان. %s', 'zarrin-gold-gateway' ),
                        '<em>(' . __( 'در نسخه‌های بعدی به‌صورت خودکار از API دریافت خواهد شد.', 'zarrin-gold-gateway' ) . ')</em>'
                    ),
                    'custom_attributes' => array(
                        'min'  => '0',
                        'step' => '1',
                    ),
                    'default' => '0',
                ),
                'order_status' => array(
                    'title'       => __( 'وضعیت سفارش پس از پرداخت', 'zarrin-gold-gateway' ),
                    'type'        => 'select',
                    'options'     => array(
                        'processing' => __( 'در حال پردازش', 'zarrin-gold-gateway' ),
                        'completed'  => __( 'تکمیل‌شده', 'zarrin-gold-gateway' ),
                    ),
                    'description' => __( 'وضعیت سفارش پس از تأیید موفق پرداخت.', 'zarrin-gold-gateway' ),
                    'default'     => 'processing',
                ),

                /* ── Section: Advanced ───────────────────────────────────── */
                'debug_mode' => array(
                    'title'       => __( 'حالت عیب‌یابی (Debug)', 'zarrin-gold-gateway' ),
                    'type'        => 'checkbox',
                    'label'       => __( 'فعال‌سازی گزارش‌گیری کامل', 'zarrin-gold-gateway' ),
                    'description' => __( 'تمام درخواست‌ها و پاسخ‌های API ثبت می‌شوند. مناسب برای رفع مشکلات.', 'zarrin-gold-gateway' ),
                    'default'     => 'no',
                ),
            );
        }

        /* ──────────────────────────────────────────────────────────────────
         * Custom webhook_info field renderer
         * ────────────────────────────────────────────────────────────────── */
        public function generate_webhook_info_html( $key, $value ) {
            $webhook_url = esc_url( add_query_arg( 'wc_zarrin_callback', '1', home_url( '/' ) ) );
            ob_start();
            ?>
            <tr valign="top">
                <th scope="row" class="titledesc">
                    <label for="<?php echo esc_attr( $this->get_field_key( $key ) ); ?>">
                        <?php echo esc_html( $this->form_fields[ $key ]['title'] ); ?>
                    </label>
                </th>
                <td class="forminp">
                    <fieldset>
                        <legend class="screen-reader-text">
                            <span><?php echo esc_html( $this->form_fields[ $key ]['title'] ); ?></span>
                        </legend>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                            <input
                                type="text"
                                id="<?php echo esc_attr( $this->get_field_key( $key ) ); ?>"
                                value="<?php echo $webhook_url; ?>"
                                readonly
                                style="width:100%;max-width:500px;background:#f9f9f9;border:1px solid #ccc;padding:6px 10px;font-family:monospace;direction:ltr;text-align:left;border-radius:4px;"
                            />
                            <button
                                type="button"
                                onclick="navigator.clipboard.writeText(this.previousElementSibling.value);this.textContent='<?php echo esc_js( __( 'کپی شد!', 'zarrin-gold-gateway' ) ); ?>';setTimeout(()=>{this.textContent='<?php echo esc_js( __( 'کپی', 'zarrin-gold-gateway' ) ); ?>';},1500);"
                                class="button"
                                style="white-space:nowrap;"
                            ><?php echo esc_html__( 'کپی', 'zarrin-gold-gateway' ); ?></button>
                        </div>
                        <p class="description" style="margin-top:6px;">
                            <?php esc_html_e( 'این آدرس را در پنل تاجر زرین گلد به‌عنوان آدرس بازگشت (Callback URL) وارد کنید.', 'zarrin-gold-gateway' ); ?>
                        </p>
                    </fieldset>
                </td>
            </tr>
            <?php
            return ob_get_clean();
        }

        /* ──────────────────────────────────────────────────────────────────
         * Admin Options — inject gold-themed CSS and extra sections
         * ────────────────────────────────────────────────────────────────── */
        public function admin_options() {
            ?>
            <style>
                .zarrin-admin-wrap h2 { display:flex; align-items:center; gap:12px; }
                .zarrin-admin-wrap .zarrin-badge {
                    display:inline-block;
                    background:linear-gradient(135deg,#FFD700,#DAA520);
                    color:#5C3D00;
                    padding:3px 12px;
                    border-radius:12px;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:0.5px;
                }
                .zarrin-section-title {
                    font-size:14px;
                    font-weight:600;
                    color:#B8860B;
                    margin:20px 0 8px;
                    padding-bottom:6px;
                    border-bottom:2px solid #FFD700;
                    display:inline-block;
                }
                .zarrin-test-btn {
                    background:linear-gradient(135deg,#FFD700,#DAA520);
                    color:#5C3D00 !important;
                    border:none;
                    padding:8px 20px;
                    border-radius:6px;
                    font-weight:700;
                    cursor:pointer;
                    transition:all .2s;
                }
                .zarrin-test-btn:hover { opacity:0.85; transform:translateY(-1px); }
                .zarrin-log-table { width:100%; border-collapse:collapse; margin-top:12px; }
                .zarrin-log-table th,
                .zarrin-log-table td { padding:8px 10px; border:1px solid #e0d6c0; text-align:right; font-size:13px; }
                .zarrin-log-table th { background:linear-gradient(135deg,#FFD700,#f0e68c); color:#5C3D00; font-weight:600; }
                .zarrin-log-table tr:nth-child(even) td { background:#fdfbf2; }
                .zarrin-status-paid { color:#16a34a; font-weight:600; }
                .zarrin-status-failed { color:#dc2626; font-weight:600; }
                .zarrin-status-pending { color:#d97706; font-weight:600; }
            </style>
            <div class="wrap zarrin-admin-wrap">
                <h2>
                    <?php echo esc_html( $this->get_method_title() ); ?>
                    <span class="zarrin-badge"><?php echo esc_html( sprintf( 'نسخه %s', self::VERSION ) ); ?></span>
                </h2>

                <?php if ( $this->debug_mode ) : ?>
                    <div class="notice notice-info inline" style="border-left-color:#FFD700;">
                        <p>
                            <strong><?php esc_html_e( 'حالت عیب‌یابی فعال است.', 'zarrin-gold-gateway' ); ?></strong>
                            <?php esc_html_e( 'گزارش‌ها در فایل لاگ ووکامرس (WooCommerce &gt; Status &gt; Logs) ذخیره می‌شوند.', 'zarrin-gold-gateway' ); ?>
                        </p>
                    </div>
                <?php endif; ?>

                <?php if ( empty( $this->api_key ) || empty( $this->api_secret ) ) : ?>
                    <div class="notice notice-warning inline">
                        <p>
                            <?php esc_html_e( '⚠️ لطفاً کلید API و رمز API را وارد کنید تا درگاه به درستی کار کند.', 'zarrin-gold-gateway' ); ?>
                        </p>
                    </div>
                <?php endif; ?>

                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <?php wp_nonce_field( 'woocommerce-settings' ); ?>

                    <p class="zarrin-section-title"><?php esc_html_e( '⚙️ تنظیمات عمومی', 'zarrin-gold-gateway' ); ?></p>
                    <?php $this->generate_settings_html( array( 'enabled', 'title', 'description' ) ); ?>

                    <p class="zarrin-section-title"><?php esc_html_e( '🔑 اطلاعات API', 'zarrin-gold-gateway' ); ?></p>
                    <?php $this->generate_settings_html( array( 'api_key', 'api_secret', 'gateway_url', 'webhook_info' ) ); ?>

                    <table class="form-table">
                        <tr>
                            <th><?php esc_html_e( 'تست اتصال', 'zarrin-gold-gateway' ); ?></th>
                            <td>
                                <button type="button" class="zarrin-test-btn" id="zarrin-test-connection" onclick="zarrinTestConnection(this);">
                                    <?php esc_html_e( '🔍 آزمایش اتصال به سرور زرین گلد', 'zarrin-gold-gateway' ); ?>
                                </button>
                                <span id="zarrin-test-result" style="margin-right:12px;font-size:13px;"></span>
                            </td>
                        </tr>
                    </table>

                    <p class="zarrin-section-title"><?php esc_html_e( '💰 تنظیمات پرداخت', 'zarrin-gold-gateway' ); ?></p>
                    <?php $this->generate_settings_html( array( 'payment_mode', 'gold_price', 'order_status' ) ); ?>

                    <p class="zarrin-section-title"><?php esc_html_e( '🔧 تنظیمات پیشرفته', 'zarrin-gold-gateway' ); ?></p>
                    <?php $this->generate_settings_html( array( 'debug_mode' ) ); ?>

                    <?php submit_button(); ?>
                </form>

                <?php $this->render_webhook_log(); ?>
            </div>

            <script>
            function zarrinTestConnection(btn) {
                var resultSpan = document.getElementById('zarrin-test-result');
                btn.disabled = true;
                btn.textContent = '<?php echo esc_js( __( 'در حال آزمایش...', 'zarrin-gold-gateway' ) ); ?>';
                resultSpan.textContent = '';

                var xhr = new XMLHttpRequest();
                xhr.open('POST', ajaxurl, true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = function() {
                    btn.disabled = false;
                    btn.textContent = '<?php echo esc_js( __( '🔍 آزمایش اتصال به سرور زرین گلد', 'zarrin-gold-gateway' ) ); ?>';
                    try {
                        var res = JSON.parse(xhr.responseText);
                        resultSpan.innerHTML = res.success
                            ? '<span style="color:#16a34a;">✅ ' + res.data + '</span>'
                            : '<span style="color:#dc2626;">❌ ' + (res.data || '<?php echo esc_js( __( 'خطای ناشناخته', 'zarrin-gold-gateway' ) ); ?>') + '</span>';
                    } catch(e) {
                        resultSpan.innerHTML = '<span style="color:#dc2626;">❌ <?php echo esc_js( __( 'خطا در دریافت پاسخ', 'zarrin-gold-gateway' ) ); ?></span>';
                    }
                };
                xhr.onerror = function() {
                    btn.disabled = false;
                    btn.textContent = '<?php echo esc_js( __( '🔍 آزمایش اتصال به سرور زرین گلد', 'zarrin-gold-gateway' ) ); ?>';
                    resultSpan.innerHTML = '<span style="color:#dc2626;">❌ <?php echo esc_js( __( 'خطا در ارتباط با سرور', 'zarrin-gold-gateway' ) ); ?></span>';
                };
                xhr.send('action=zarrin_gold_test_connection&nonce=<?php echo esc_js( wp_create_nonce( 'zarrin_gold_admin' ) ); ?>');
            }
            </script>
            <?php
        }

        /* ──────────────────────────────────────────────────────────────────
         * Render webhook log table on admin page
         * ────────────────────────────────────────────────────────────────── */
        private function render_webhook_log() {
            $log = get_option( self::WEBHOOK_LOG_KEY, array() );
            if ( empty( $log ) ) {
                return;
            }
            ?>
            <div style="margin-top:30px;">
                <p class="zarrin-section-title"><?php esc_html_e( '📋 گزارش وب‌هوک (آخرین ۱۰ رویداد)', 'zarrin-gold-gateway' ); ?></p>
                <button
                    type="button"
                    class="button"
                    style="margin-bottom:10px;"
                    onclick="zarrinClearLog(this);"
                ><?php esc_html_e( '🗑️ پاک‌سازی گزارش', 'zarrin-gold-gateway' ); ?></button>
                <table class="zarrin-log-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th><?php esc_html_e( 'تاریخ و ساعت', 'zarrin-gold-gateway' ); ?></th>
                            <th><?php esc_html_e( 'شناسه پرداخت', 'zarrin-gold-gateway' ); ?></th>
                            <th><?php esc_html_e( 'شماره سفارش', 'zarrin-gold-gateway' ); ?></th>
                            <th><?php esc_html_e( 'وضعیت', 'zarrin-gold-gateway' ); ?></th>
                            <th><?php esc_html_e( 'مقدار (گرم)', 'zarrin-gold-gateway' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php foreach ( array_reverse( $log ) as $i => $entry ) : ?>
                        <tr>
                            <td><?php echo esc_html( count( $log ) - $i ); ?></td>
                            <td style="direction:ltr;text-align:center;"><?php echo esc_html( $entry['date'] ); ?></td>
                            <td style="direction:ltr;"><?php echo esc_html( $entry['payment_id'] ?? '-' ); ?></td>
                            <td style="direction:ltr;"><?php echo esc_html( $entry['order_id'] ?? '-' ); ?></td>
                            <td>
                                <span class="zarrin-status-<?php echo esc_attr( sanitize_key( $entry['status'] ?? '' ) ); ?>">
                                    <?php
                                    $statuses = array(
                                        'paid'    => __( 'پرداخت‌شده', 'zarrin-gold-gateway' ),
                                        'pending' => __( 'در انتظار', 'zarrin-gold-gateway' ),
                                        'expired' => __( 'منقضی‌شده', 'zarrin-gold-gateway' ),
                                        'failed'  => __( 'ناموفق', 'zarrin-gold-gateway' ),
                                    );
                                    echo esc_html( $statuses[ $entry['status'] ?? '' ] ?? $entry['status'] );
                                    ?>
                                </span>
                            </td>
                            <td><?php echo esc_html( $entry['grams'] ?? '-' ); ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <script>
            function zarrinClearLog(btn) {
                if (!confirm('<?php echo esc_js( __( 'آیا از پاک‌سازی گزارش مطمئن هستید؟', 'zarrin-gold-gateway' ) ); ?>')) return;
                var xhr = new XMLHttpRequest();
                xhr.open('POST', ajaxurl, true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = function() {
                    if (xhr.status === 200) { location.reload(); }
                };
                xhr.send('action=zarrin_gold_clear_log&nonce=<?php echo esc_js( wp_create_nonce( 'zarrin_gold_admin' ) ); ?>');
            }
            </script>
            <?php
        }

        /* ──────────────────────────────────────────────────────────────────
         * AJAX: Test Connection
         * ────────────────────────────────────────────────────────────────── */
        public function ajax_test_connection() {
            check_ajax_referer( 'zarrin_gold_admin', 'nonce' );

            $api_key    = isset( $_POST['api_key'] ) ? sanitize_text_field( $_POST['api_key'] ) : $this->api_key;
            $api_secret = isset( $_POST['api_secret'] ) ? sanitize_text_field( $_POST['api_secret'] ) : $this->api_secret;
            $gateway_url = isset( $_POST['gateway_url'] ) ? esc_url_raw( $_POST['gateway_url'] ) : $this->gateway_url;

            if ( empty( $api_key ) || empty( $api_secret ) ) {
                wp_send_json_error( __( 'کلید API و رمز API الزامی هستند.', 'zarrin-gold-gateway' ) );
            }

            $url = rtrim( $gateway_url, '/' ) . '/api/gateway/pay/create';

            $response = wp_remote_post( $url, array(
                'timeout' => 15,
                'headers' => array(
                    'X-API-Key'    => $api_key,
                    'Content-Type' => 'application/json',
                ),
                'body' => json_encode( array(
                    'apiSecret'      => $api_secret,
                    'amountGrams'    => 0.001,
                    'merchantOrderId' => 'TEST-' . time(),
                    'callbackUrl'    => home_url( '/' ),
                    'description'    => 'Connection Test',
                ) ),
            ) );

            if ( is_wp_error( $response ) ) {
                wp_send_json_error( __( 'خطا در ارتباط با سرور: ', 'zarrin-gold-gateway' ) . $response->get_error_message() );
            }

            $code = wp_remote_retrieve_response_code( $response );
            $body = json_decode( wp_remote_retrieve_body( $response ), true );

            // 200/201 means the server is reachable and API key is accepted
            if ( $code >= 200 && $code < 300 ) {
                wp_send_json_success( __( 'اتصال با موفقیت برقرار شد! تنظیمات درست هستند.', 'zarrin-gold-gateway' ) );
            } else {
                $msg = isset( $body['message'] ) ? $body['message'] : __( 'خطای ناشناخته. کد پاسخ: ', 'zarrin-gold-gateway' ) . $code;
                wp_send_json_error( $msg );
            }
        }

        /* ──────────────────────────────────────────────────────────────────
         * AJAX: Clear Webhook Log
         * ────────────────────────────────────────────────────────────────── */
        public function ajax_clear_log() {
            check_ajax_referer( 'zarrin_gold_admin', 'nonce' );
            update_option( self::WEBHOOK_LOG_KEY, array() );
            wp_send_json_success();
        }

        /* ──────────────────────────────────────────────────────────────────
         * Register Callback Endpoint
         * ────────────────────────────────────────────────────────────────── */
        public function register_callback_endpoint() {
            add_action( 'parse_request', array( $this, 'handle_callback_request' ) );
        }

        public function handle_callback_request() {
            // Only handle requests with our query var
            if ( ! isset( $_GET['wc_zarrin_callback'] ) || '1' !== $_GET['wc_zarrin_callback'] ) {
                return;
            }

            $this->log( 'callback_request', 'Webhook request received.' );

            // ─── Handle POST (webhook from Zarrin Gold) ──────────────
            if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
                $raw_body = file_get_contents( 'php://input' );
                $payload  = json_decode( $raw_body, true );

                $this->log( 'callback_body', 'Webhook payload: ' . $raw_body );

                if ( ! $payload || empty( $payload['paymentId'] ) || empty( $payload['merchantOrderId'] ) ) {
                    $this->log( 'callback_error', 'Invalid webhook payload.' );
                    wp_send_json_error( array( 'message' => 'Invalid payload.' ), 400 );
                    return;
                }

                $payment_id        = sanitize_text_field( $payload['paymentId'] );
                $merchant_order_id = sanitize_text_field( $payload['merchantOrderId'] );

                // Extract WC order ID from "WC-1234" format
                $order_id = $this->extract_order_id( $merchant_order_id );

                if ( ! $order_id ) {
                    $this->log( 'callback_error', 'Could not extract order ID from: ' . $merchant_order_id );
                    wp_send_json_success();
                    return;
                }

                $order = wc_get_order( $order_id );
                if ( ! $order ) {
                    $this->log( 'callback_error', 'Order not found: ' . $order_id );
                    wp_send_json_success();
                    return;
                }

                // ── Security: Re-verify payment status via API ─────────
                $payment_status = $this->verify_payment( $payment_id );

                if ( is_wp_error( $payment_status ) ) {
                    $this->log( 'callback_verify_error', 'Verification failed: ' . $payment_status->get_error_message() );
                    // Still respond 200 to prevent retries, but log the error
                    wp_send_json_success();
                    return;
                }

                $this->log( 'callback_verified', 'Verified status: ' . $payment_status['status'] . ' for payment ' . $payment_id );

                // ── Process payment ────────────────────────────────────
                if ( 'paid' === $payment_status['status'] ) {
                    // Prevent duplicate processing
                    if ( ! $order->has_status( array( 'processing', 'completed' ) ) ) {
                        $target_status = $this->order_status;
                        $order->update_status( $target_status, sprintf(
                            /* translators: %s: payment ID */
                            __( 'پرداخت با طلای زرین گلد تأیید شد — شناسه پرداخت: %s', 'zarrin-gold-gateway' ),
                            $payment_id
                        ) );

                        // Save payment details as order meta
                        $order->update_meta_data( '_zarrin_gold_payment_id', $payment_id );
                        $order->update_meta_data( '_zarrin_gold_status', 'paid' );
                        $order->update_meta_data( '_zarrin_gold_amount_grams', $payment_status['amountGrams'] ?? 0 );
                        $order->update_meta_data( '_zarrin_gold_amount_fiat', $payment_status['amountFiat'] ?? 0 );
                        $order->update_meta_data( '_zarrin_gold_fee_grams', $payment_status['feeGrams'] ?? 0 );
                        $order->update_meta_data( '_zarrin_gold_gold_price', $payment_status['goldPrice'] ?? 0 );
                        if ( ! empty( $payment_status['paidAt'] ) ) {
                            $order->update_meta_data( '_zarrin_gold_paid_at', $payment_status['paidAt'] );
                        }
                        $order->save();

                        // Reduce stock & clear cart
                        wc_reduce_stock_levels( $order_id );
                        $order->save();

                        $this->log( 'callback_success', 'Order ' . $order_id . ' marked as ' . $target_status . '.' );
                    } else {
                        $this->log( 'callback_duplicate', 'Order ' . $order_id . ' already processed.' );
                    }
                }

                // ── Log webhook event ─────────────────────────────────
                $this->add_webhook_log_entry( array(
                    'date'       => current_time( 'Y-m-d H:i:s' ),
                    'payment_id' => $payment_id,
                    'order_id'   => $merchant_order_id,
                    'status'     => $payment_status['status'],
                    'grams'      => $payment_status['amountGrams'] ?? 0,
                ) );

                // Respond with success
                wp_send_json_success( array( 'success' => true ) );
                return;
            }

            // ─── Handle GET (user returning from payment page) ───────
            if ( 'GET' === $_SERVER['REQUEST_METHOD'] ) {
                $order_id   = isset( $_GET['order_id'] ) ? absint( $_GET['order_id'] ) : 0;
                $payment_id = isset( $_GET['payment_id'] ) ? sanitize_text_field( $_GET['payment_id'] ) : '';

                if ( ! $order_id || ! $payment_id ) {
                    $this->log( 'return_error', 'Missing order_id or payment_id in return.' );
                    wc_add_notice( __( 'خطا: اطلاعات بازگشت ناقص است.', 'zarrin-gold-gateway' ), 'error' );
                    wp_redirect( wc_get_page_permalink( 'checkout' ) );
                    exit;
                }

                $order = wc_get_order( $order_id );
                if ( ! $order ) {
                    wc_add_notice( __( 'خطا: سفارش مورد نظر یافت نشد.', 'zarrin-gold-gateway' ), 'error' );
                    wp_redirect( wc_get_page_permalink( 'checkout' ) );
                    exit;
                }

                // Verify payment status
                $payment_status = $this->verify_payment( $payment_id );

                if ( is_wp_error( $payment_status ) ) {
                    $this->log( 'return_verify_error', 'Return verification failed: ' . $payment_status->get_error_message() );
                    wc_add_notice(
                        __( 'خطا در تأیید وضعیت پرداخت. لطفاً با پشتیبانی تماس بگیرید.', 'zarrin-gold-gateway' ),
                        'error'
                    );
                    wp_redirect( $order->get_checkout_payment_url() );
                    exit;
                }

                if ( 'paid' === $payment_status['status'] ) {
                    // Process if not already processed
                    if ( ! $order->has_status( array( 'processing', 'completed' ) ) ) {
                        $target_status = $this->order_status;
                        $order->update_status( $target_status, sprintf(
                            __( 'پرداخت با طلای زرین گلد تأیید شد — شناسه پرداخت: %s', 'zarrin-gold-gateway' ),
                            $payment_id
                        ) );
                        $order->update_meta_data( '_zarrin_gold_payment_id', $payment_id );
                        $order->update_meta_data( '_zarrin_gold_status', 'paid' );
                        $order->update_meta_data( '_zarrin_gold_amount_grams', $payment_status['amountGrams'] ?? 0 );
                        $order->update_meta_data( '_zarrin_gold_amount_fiat', $payment_status['amountFiat'] ?? 0 );
                        $order->update_meta_data( '_zarrin_gold_fee_grams', $payment_status['feeGrams'] ?? 0 );
                        $order->update_meta_data( '_zarrin_gold_gold_price', $payment_status['goldPrice'] ?? 0 );
                        if ( ! empty( $payment_status['paidAt'] ) ) {
                            $order->update_meta_data( '_zarrin_gold_paid_at', $payment_status['paidAt'] );
                        }
                        $order->save();
                        wc_reduce_stock_levels( $order_id );
                    }

                    $this->log( 'return_success', 'User returned with paid status for order ' . $order_id . '.' );
                    wc_add_notice( __( 'پرداخت شما با موفقیت انجام شد!', 'zarrin-gold-gateway' ), 'success' );
                    wp_redirect( $order->get_checkout_order_received_url() );
                    exit;
                }

                if ( 'pending' === $payment_status['status'] ) {
                    $this->log( 'return_pending', 'User returned but payment still pending for order ' . $order_id . '.' );
                    wc_add_notice( __( 'پرداخت هنوز تأیید نشده است. لطفاً کمی صبر کنید یا وضعیت سفارش خود را بررسی کنید.', 'zarrin-gold-gateway' ), 'notice' );
                    wp_redirect( $order->get_view_order_url() );
                    exit;
                }

                // expired, failed, etc.
                $this->log( 'return_failed', 'Payment failed/expired for order ' . $order_id . '. Status: ' . $payment_status['status'] );
                $order->update_status( 'failed', sprintf(
                    __( 'پرداخت زرین گلد ناموفق — وضعیت: %s', 'zarrin-gold-gateway' ),
                    $payment_status['status']
                ) );
                $order->update_meta_data( '_zarrin_gold_status', $payment_status['status'] );
                $order->save();

                wc_add_notice( __( 'پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.', 'zarrin-gold-gateway' ), 'error' );
                wp_redirect( $order->get_checkout_payment_url() );
                exit;
            }
        }

        /* ──────────────────────────────────────────────────────────────────
         * Payment Processing (checkout)
         * ────────────────────────────────────────────────────────────────── */
        public function process_payment( $order_id ) {
            $order = wc_get_order( $order_id );

            if ( ! $order ) {
                wc_add_notice( __( 'خطا: سفارش مورد نظر یافت نشد.', 'zarrin-gold-gateway' ), 'error' );
                return;
            }

            if ( empty( $this->api_key ) || empty( $this->api_secret ) ) {
                wc_add_notice( __( 'درگاه پرداخت تنظیم نشده است. لطفاً با مدیر سایت تماس بگیرید.', 'zarrin-gold-gateway' ), 'error' );
                return;
            }

            // Generate unique payment ID
            $merchant_order_id = 'WC-' . $order_id . '-' . time();

            // Save to order meta for tracking
            $order->update_meta_data( '_zarrin_gold_merchant_order_id', $merchant_order_id );
            $order->save();

            // ── Build payment creation payload ────────────────────────
            $order_total = (float) $order->get_total();

            $payload = array(
                'apiSecret'      => $this->api_secret,
                'merchantOrderId' => $merchant_order_id,
                'callbackUrl'    => $this->webhook_url,
                'description'    => sprintf(
                    /* translators: %s: order number */
                    __( 'سفارش %s — %s', 'zarrin-gold-gateway' ),
                    $order->get_order_number(),
                    wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
                ),
            );

            if ( 'gold_amount' === $this->payment_mode ) {
                // Pay in grams — order total represents grams
                $payload['amountGrams'] = round( $order_total, 4 );
            } else {
                // Pay in fiat — convert to gold
                if ( $this->gold_price <= 0 ) {
                    wc_add_notice(
                        __( 'خطا: قیمت طلا تنظیم نشده است. لطفاً با مدیر سایت تماس بگیرید.', 'zarrin-gold-gateway' ),
                        'error'
                    );
                    return;
                }
                $payload['amountFiat'] = round( $order_total );
                $payload['goldPrice']  = $this->gold_price;
            }

            $this->log( 'create_payment', 'Creating payment for order ' . $order_id . '. Payload: ' . json_encode( $payload, JSON_UNESCAPED_UNICODE ) );

            // ── Call API ──────────────────────────────────────────────
            $api_url  = rtrim( $this->gateway_url, '/' ) . '/api/gateway/pay/create';
            $response = wp_remote_post( $api_url, array(
                'timeout' => 30,
                'headers' => array(
                    'X-API-Key'    => $this->api_key,
                    'Content-Type' => 'application/json',
                ),
                'body' => json_encode( $payload ),
            ) );

            if ( is_wp_error( $response ) ) {
                $error_msg = $response->get_error_message();
                $this->log( 'create_payment_error', 'API connection error: ' . $error_msg );
                wc_add_notice( __( 'خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید.', 'zarrin-gold-gateway' ), 'error' );
                return;
            }

            $response_code = wp_remote_retrieve_response_code( $response );
            $response_body = json_decode( wp_remote_retrieve_body( $response ), true );

            $this->log( 'create_payment_response', 'API response (' . $response_code . '): ' . wp_remote_retrieve_body( $response ) );

            if ( $response_code < 200 || $response_code >= 300 || empty( $response_body['success'] ) ) {
                $api_message = $response_body['message'] ?? __( 'خطای ناشناخته', 'zarrin-gold-gateway' );
                $this->log( 'create_payment_failed', 'Payment creation failed: ' . $api_message );
                $order->update_status( 'failed', sprintf(
                    __( 'خطا در ایجاد پرداخت زرین گلد: %s', 'zarrin-gold-gateway' ),
                    $api_message
                ) );
                wc_add_notice(
                    sprintf( __( 'خطا در ایجاد پرداخت: %s', 'zarrin-gold-gateway' ), $api_message ),
                    'error'
                );
                return;
            }

            // ── Success — save details & redirect ────────────────────
            $payment = $response_body['payment'];
            $payment_id = $payment['id'] ?? '';

            $order->update_meta_data( '_zarrin_gold_payment_id', $payment_id );
            $order->update_meta_data( '_zarrin_gold_payment_url', $payment['paymentUrl'] ?? '' );
            $order->update_meta_data( '_zarrin_gold_amount_grams', $payment['amountGrams'] ?? 0 );
            $order->update_meta_data( '_zarrin_gold_amount_fiat', $payment['amountFiat'] ?? 0 );
            $order->update_meta_data( '_zarrin_gold_gold_price', $payment['goldPrice'] ?? 0 );
            $order->update_meta_data( '_zarrin_gold_expires_at', $payment['expiresAt'] ?? '' );
            $order->update_meta_data( '_zarrin_gold_status', 'pending' );
            $order->save();

            // Mark order as awaiting payment
            $order->update_status( 'pending', __( 'در انتظار پرداخت از طریق زرین گلد...', 'zarrin-gold-gateway' ) );

            $this->log( 'create_payment_success', 'Payment created. ID: ' . $payment_id . '. Redirect URL: ' . ( $payment['paymentUrl'] ?? '' ) );

            // ── Return redirect array ────────────────────────────────
            $return_url = add_query_arg( array(
                'order_id'   => $order_id,
                'payment_id' => $payment_id,
            ), $this->webhook_url );

            return array(
                'result'   => 'success',
                'redirect' => $payment['paymentUrl'] ?? $return_url,
            );
        }

        /* ──────────────────────────────────────────────────────────────────
         * Verify Payment (GET status)
         * ────────────────────────────────────────────────────────────────── */
        private function verify_payment( $payment_id ) {
            if ( empty( $this->api_key ) || empty( $this->api_secret ) ) {
                return new WP_Error( 'missing_credentials', __( 'اطلاعات API تنظیم نشده است.', 'zarrin-gold-gateway' ) );
            }

            $api_url  = rtrim( $this->gateway_url, '/' ) . '/api/gateway/pay/' . urlencode( $payment_id ) . '/status';
            $api_url .= '?apiSecret=' . urlencode( $this->api_secret );

            $this->log( 'verify_payment', 'Verifying payment: ' . $payment_id );

            $response = wp_remote_get( $api_url, array(
                'timeout' => 15,
                'headers' => array(
                    'X-API-Key' => $this->api_key,
                ),
            ) );

            if ( is_wp_error( $response ) ) {
                $this->log( 'verify_payment_error', 'Connection error: ' . $response->get_error_message() );
                return $response;
            }

            $code = wp_remote_retrieve_response_code( $response );
            $body = json_decode( wp_remote_retrieve_body( $response ), true );

            $this->log( 'verify_payment_response', 'Verification response (' . $code . '): ' . wp_remote_retrieve_body( $response ) );

            if ( $code < 200 || $code >= 300 || empty( $body['success'] ) ) {
                return new WP_Error( 'api_error', __( 'خطا در تأیید وضعیت پرداخت.', 'zarrin-gold-gateway' ) );
            }

            return $body['payment'];
        }

        /* ──────────────────────────────────────────────────────────────────
         * Extract WooCommerce order ID from merchant order ID string
         * "WC-123-1706100000" → 123
         * ────────────────────────────────────────────────────────────────── */
        private function extract_order_id( $merchant_order_id ) {
            // Pattern: WC-{order_id}-{timestamp}
            if ( preg_match( '/^WC-(\d+)-\d+$/', $merchant_order_id, $matches ) ) {
                return absint( $matches[1] );
            }
            // Fallback: WC-{order_id}
            if ( preg_match( '/^WC-(\d+)$/', $merchant_order_id, $matches ) ) {
                return absint( $matches[1] );
            }
            return 0;
        }

        /* ──────────────────────────────────────────────────────────────────
         * Webhook Log Management
         * ────────────────────────────────────────────────────────────────── */
        private function add_webhook_log_entry( array $entry ) {
            $log = get_option( self::WEBHOOK_LOG_KEY, array() );
            $log[] = $entry;

            // Keep only the last N entries
            if ( count( $log ) > self::WEBHOOK_LOG_MAX ) {
                $log = array_slice( $log, -self::WEBHOOK_LOG_MAX );
            }

            update_option( self::WEBHOOK_LOG_KEY, $log );
        }

        /* ──────────────────────────────────────────────────────────────────
         * Logging via WC_Logger
         * ────────────────────────────────────────────────────────────────── */
        private function log( $context, $message ) {
            if ( ! $this->debug_mode ) {
                return;
            }

            $logger = wc_get_logger();
            $logger->info( $message, array(
                'source' => 'zarrin-gold-' . $context,
            ) );
        }

        /* ──────────────────────────────────────────────────────────────────
         * Validate admin fields — check gold price when fiat mode is on
         * ────────────────────────────────────────────────────────────────── */
        public function validate_fields() {
            // Called by process_admin_options()
            return true;
        }

        public function process_admin_options() {
            parent::process_admin_options();

            // Reload options after save
            $saved = $this->get_option( 'payment_mode' );
            $gold  = (float) $this->get_option( 'gold_price', 0 );

            if ( 'fiat_amount' === $saved && $gold <= 0 ) {
                WC_Admin_Settings::add_error(
                    __( 'هشدار: قیمت طلا در حالت ریالی الزامی است.', 'zarrin-gold-gateway' )
                );
            }
        }
    }

} // end plugins_loaded check

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Register gateway with WooCommerce
 * ─────────────────────────────────────────────────────────────────────────────
 */
add_filter( 'woocommerce_payment_gateways', 'zarrin_gold_add_gateway' );
function zarrin_gold_add_gateway( $gateways ) {
    $gateways[] = 'WC_Zarrin_Gold_Gateway';
    return $gateways;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Plugin action links (Settings, Deactivate)
 * ─────────────────────────────────────────────────────────────────────────────
 */
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'zarrin_gold_plugin_action_links' );
function zarrin_gold_plugin_action_links( $links ) {
    $settings_url = admin_url( 'admin.php?page=wc-settings&tab=checkout&section=zarrin_gold' );
    array_unshift( $links, '<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'تنظیمات', 'zarrin-gold-gateway' ) . '</a>' );
    return $links;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Add Zarrin Gold info to order details meta box
 * ─────────────────────────────────────────────────────────────────────────────
 */
add_action( 'woocommerce_admin_order_data_after_billing_address', 'zarrin_gold_order_meta_display', 10, 1 );
function zarrin_gold_order_meta_display( $order ) {
    $payment_id  = $order->get_meta( '_zarrin_gold_payment_id' );
    $status      = $order->get_meta( '_zarrin_gold_status' );
    $grams       = $order->get_meta( '_zarrin_gold_amount_grams' );
    $fiat        = $order->get_meta( '_zarrin_gold_amount_fiat' );
    $gold_price  = $order->get_meta( '_zarrin_gold_gold_price' );
    $paid_at     = $order->get_meta( '_zarrin_gold_paid_at' );

    if ( empty( $payment_id ) ) {
        return;
    }

    $status_labels = array(
        'paid'    => __( 'پرداخت‌شده', 'zarrin-gold-gateway' ),
        'pending' => __( 'در انتظار', 'zarrin-gold-gateway' ),
        'expired' => __( 'منقضی‌شده', 'zarrin-gold-gateway' ),
        'failed'  => __( 'ناموفق', 'zarrin-gold-gateway' ),
    );
    $status_label = $status_labels[ $status ] ?? $status;

    ?>
    <div style="clear:both; margin-top:15px; padding:12px; border:2px solid #FFD700; border-radius:6px; background:#FFFEF5;">
        <h4 style="margin:0 0 10px; color:#B8860B;">🪙 <?php esc_html_e( 'اطلاعات پرداخت زرین گلد', 'zarrin-gold-gateway' ); ?></h4>
        <table style="width:100%; font-size:13px;">
            <tr>
                <td style="padding:3px 8px; font-weight:600; color:#666;"><?php esc_html_e( 'شناسه پرداخت:', 'zarrin-gold-gateway' ); ?></td>
                <td style="padding:3px 8px; direction:ltr;"><?php echo esc_html( $payment_id ); ?></td>
            </tr>
            <tr>
                <td style="padding:3px 8px; font-weight:600; color:#666;"><?php esc_html_e( 'وضعیت:', 'zarrin-gold-gateway' ); ?></td>
                <td style="padding:3px 8px;">
                    <strong style="color:<?php echo 'paid' === $status ? '#16a34a' : '#d97706'; ?>">
                        <?php echo esc_html( $status_label ); ?>
                    </strong>
                </td>
            </tr>
            <?php if ( $grams ) : ?>
            <tr>
                <td style="padding:3px 8px; font-weight:600; color:#666;"><?php esc_html_e( 'مقدار طلا:', 'zarrin-gold-gateway' ); ?></td>
                <td style="padding:3px 8px;"><?php echo esc_html( number_format( (float) $grams, 4 ) ) . ' ' . esc_html__( 'گرم', 'zarrin-gold-gateway' ); ?></td>
            </tr>
            <?php endif; ?>
            <?php if ( $fiat ) : ?>
            <tr>
                <td style="padding:3px 8px; font-weight:600; color:#666;"><?php esc_html_e( 'مبلغ ریالی:', 'zarrin-gold-gateway' ); ?></td>
                <td style="padding:3px 8px;"><?php echo esc_html( number_format( (float) $fiat ) ) . ' ' . esc_html__( 'تومان', 'zarrin-gold-gateway' ); ?></td>
            </tr>
            <?php endif; ?>
            <?php if ( $gold_price ) : ?>
            <tr>
                <td style="padding:3px 8px; font-weight:600; color:#666;"><?php esc_html_e( 'قیمت هر گرم:', 'zarrin-gold-gateway' ); ?></td>
                <td style="padding:3px 8px;"><?php echo esc_html( number_format( (float) $gold_price ) ) . ' ' . esc_html__( 'تومان', 'zarrin-gold-gateway' ); ?></td>
            </tr>
            <?php endif; ?>
            <?php if ( $paid_at ) : ?>
            <tr>
                <td style="padding:3px 8px; font-weight:600; color:#666;"><?php esc_html_e( 'تاریخ پرداخت:', 'zarrin-gold-gateway' ); ?></td>
                <td style="padding:3px 8px; direction:ltr;"><?php echo esc_html( $paid_at ); ?></td>
            </tr>
            <?php endif; ?>
        </table>
    </div>
    <?php
}
