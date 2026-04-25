<?php
/**
 * Zarrin Gold — Admin Settings
 *
 * Adds advanced settings page, test connection, and stats dashboard.
 */

if (!defined('ABSPATH')) {
    exit;
}

class ZG_Admin_Settings
{
    public function __construct()
    {
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_zg_test_connection', [$this, 'ajax_test_connection']);
        add_action('wp_ajax_zg_fetch_stats', [$this, 'ajax_fetch_stats']);
    }

    /**
     * Add settings page to admin menu
     */
    public function add_settings_page(): void
    {
        add_submenu_page(
            'woocommerce',
            __('درگاه زرین گلد', 'zarrin-gold-gateway'),
            __('💰 زرین گلد', 'zarrin-gold-gateway'),
            'manage_woocommerce',
            'zarrin-gold-settings',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_assets(string $hook): void
    {
        if ($hook !== 'woocommerce_page_zarrin-gold-settings') {
            return;
        }

        wp_enqueue_style(
            'zg-admin-css',
            ZARRIN_GOLD_PLUGIN_URL . 'assets/admin.css',
            [],
            ZARRIN_GOLD_VERSION
        );

        wp_enqueue_script(
            'zg-admin-js',
            ZARRIN_GOLD_PLUGIN_URL . 'assets/admin.js',
            ['jquery'],
            ZARRIN_GOLD_VERSION,
            true
        );

        wp_localize_script('zg-admin-js', 'zgAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('zg_admin_nonce'),
            'strings' => [
                'testing'  => __('در حال تست اتصال...', 'zarrin-gold-gateway'),
                'success'  => __('اتصال موفق! ✅', 'zarrin-gold-gateway'),
                'failed'   => __('اتصال ناموفق ❌', 'zarrin-gold-gateway'),
                'loading'  => __('در حال بارگذاری...', 'zarrin-gold-gateway'),
            ],
        ]);
    }

    /**
     * Render settings page
     */
    public function render_settings_page(): void
    {
        $api_key    = get_option('zg_api_key', '');
        $api_base   = get_option('zg_api_base', '');
        $debug_mode = get_option('zg_debug_mode', 'no');
        $mode       = get_option('zg_payment_mode', 'gold');
        ?>
        <div class="wrap zg-admin-wrap">
            <div class="zg-header">
                <div class="zg-logo">
                    <span class="zg-logo-icon">Z</span>
                    <div>
                        <h1><?php esc_html_e('درگاه پرداخت زرین گلد', 'zarrin-gold-gateway'); ?></h1>
                        <p class="zg-version">v<?php echo esc_html(ZARRIN_GOLD_VERSION); ?></p>
                    </div>
                </div>
            </div>

            <!-- Connection Status Card -->
            <div class="zg-card" id="zg-connection-card">
                <h2><?php esc_html_e('وضعیت اتصال', 'zarrin-gold-gateway'); ?></h2>
                <div class="zg-status-row">
                    <span class="zg-label"><?php esc_html_e('کلید API:', 'zarrin-gold-gateway'); ?></span>
                    <span class="zg-value">
                        <?php
                        if (!empty($api_key)) {
                            echo esc_html(substr($api_key, 0, 12)) . '••••••••';
                            echo ' <span class="zg-badge zg-badge-success">فعال</span>';
                        } else {
                            echo '<span class="zg-badge zg-badge-error">تنظیم نشده</span>';
                        }
                        ?>
                    </span>
                </div>
                <div class="zg-status-row">
                    <span class="zg-label"><?php esc_html_e('آدرس سرور:', 'zarrin-gold-gateway'); ?></span>
                    <span class="zg-value">
                        <?php echo !empty($api_base) ? esc_html($api_base) : '—'; ?>
                    </span>
                </div>
                <div class="zg-status-row">
                    <span class="zg-label"><?php esc_html_e('حالت پرداخت:', 'zarrin-gold-gateway'); ?></span>
                    <span class="zg-value">
                        <?php
                        $modes = ['gold' => 'فقط طلا 💰', 'toman' => 'فقط تومان 💵', 'mixed' => 'ترکیبی'];
                        echo esc_html($modes[$mode] ?? $mode);
                        ?>
                    </span>
                </div>
                <div class="zg-status-row">
                    <span class="zg-label"><?php esc_html_e('حالت عیب‌یابی:', 'zarrin-gold-gateway'); ?></span>
                    <span class="zg-value">
                        <?php echo $debug_mode === 'yes' ? '<span class="zg-badge zg-badge-warn">فعال</span>' : '<span class="zg-badge">غیرفعال</span>'; ?>
                    </span>
                </div>

                <div class="zg-actions">
                    <button type="button" class="button button-primary" id="zg-test-btn">
                        <?php esc_html_e('تست اتصال', 'zarrin-gold-gateway'); ?>
                    </button>
                    <button type="button" class="button" id="zg-stats-btn">
                        <?php esc_html_e('آمار تراکنش‌ها', 'zarrin-gold-gateway'); ?>
                    </button>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=wc-settings&tab=checkout&section=zarrin_gold')); ?>" class="button">
                        <?php esc_html_e('تنظیمات درگاه', 'zarrin-gold-gateway'); ?>
                    </a>
                </div>
            </div>

            <!-- Test Result -->
            <div class="zg-card zg-hidden" id="zg-test-result">
                <h3><?php esc_html_e('نتیجه تست', 'zarrin-gold-gateway'); ?></h3>
                <pre id="zg-test-output"></pre>
            </div>

            <!-- Stats Card -->
            <div class="zg-card zg-hidden" id="zg-stats-card">
                <h3><?php esc_html_e('آمار تراکنش‌ها', 'zarrin-gold-gateway'); ?></h3>
                <div id="zg-stats-output"></div>
            </div>

            <!-- Documentation Card -->
            <div class="zg-card">
                <h2><?php esc_html_e('مستندات API', 'zarrin-gold-gateway'); ?></h2>
                <div class="zg-docs">
                    <h3>۱. ساخت کلید API</h3>
                    <p>
                        وارد <strong>پنل فروشندگان زرین گلد</strong> شوید، از بخش <em>کلیدهای API</em> یک کلید جدید بسازید.
                        مقدار <code>gp_live_...</code> را کپی و در تنظیمات درگاه وارد کنید.
                    </p>

                    <h3>۲. آدرس وب‌هوک</h3>
                    <p>آدرس زیر را در تنظیمات وب‌هوک پنل فروشندگان وارد کنید:</p>
                    <code class="zg-code"><?php echo esc_url(home_url('/wc-api/zg_webhook')); ?></code>

                    <h3>۳. نحوه عملکرد</h3>
                    <ol>
                        <li>مشتری سفارش ثبت می‌کند و به صفحه پرداخت زرین گلد هدایت می‌شود</li>
                        <li>مشتری با طلا (کیف پول طلایی) یا تومان پرداخت می‌کند</li>
                        <li>پس از پرداخت، به سایت فروشنده بازگردانده می‌شود</li>
                        <li>وب‌هوک تأیید پرداخت به سایت ارسال می‌شود</li>
                        <li>سفارش به وضعیت «در حال پردازش» تغییر می‌کند</li>
                    </ol>

                    <h3>۴. غیرفعال کردن ریال</h3>
                    <p>
                        با انتخاب حالت <strong>«فقط طلا»</strong> در تنظیمات، تمام مبالغ به گرم طلا نمایش و پرداخت می‌شوند.
                        هیچ مبلغ ریالی یا تومانی به مشتری نمایش داده نمی‌شود.
                    </p>

                    <h3>۵. بازگشت وجه</h3>
                    <p>
                        از بخش مدیریت سفارش‌های ووکامرس می‌توانید مستقیماً بازگشت وجه (Refund) ثبت کنید.
                        مبلغ به کیف پول مشتری در زرین گلد برمی‌گردد.
                    </p>
                </div>
            </div>

            <!-- PHP cURL Test -->
            <div class="zg-card">
                <h2><?php esc_html_e('کد نمونه PHP (بدون ووکامرس)', 'zarrin-gold-gateway'); ?></h2>
                <pre class="zg-code-block">&lt;?php
// ─── ایجاد پرداخت ───
$ch = curl_init('https://YOUR-SITE.com/api/v1/payment/request');
curl_setopt_array($ch, [
    CURLOPT_POST           =&gt; true,
    CURLOPT_RETURNTRANSFER =&gt; true,
    CURLOPT_HTTPHEADER     =&gt; ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     =&gt; json_encode([
        'api_key'        =&gt; 'gp_live_XXXXXXXXXXXXXXXXXXXXXXXX',
        'amount'         =&gt; 500000,          // مبلغ به تومان (اختیاری)
        'currency'       =&gt; 'gold',          // gold | toman | mixed
        'payment_method' =&gt; 'gold',
        'callback_url'   =&gt; 'https://yoursite.com/callback.php',
        'description'    =&gt; 'سفارش #1234',
        'customer_name'  =&gt; 'علی محمدی',
        'customer_phone' =&gt; '09120000000',
    ]),
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

if ($data['success']) {
    $authority   = $data['data']['authority'];
    $payment_url = $data['data']['payment_url'];
    $gold_grams  = $data['data']['gold_grams'];

    // هدایت مشتری به صفحه پرداخت
    header("Location: {$payment_url}");
    exit;
}

// ─── تأیید پرداخت (در صفحه callback) ───
$authority = $_GET['authority'] ?? '';
$ch = curl_init('https://YOUR-SITE.com/api/v1/payment/verify');
curl_setopt_array($ch, [
    CURLOPT_POST           =&gt; true,
    CURLOPT_RETURNTRANSFER =&gt; true,
    CURLOPT_HTTPHEADER     =&gt; ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     =&gt; json_encode([
        'authority' =&gt; $authority,
        'status'    =&gt; 'OK',
    ]),
]);

$result = json_decode(curl_exec($ch), true);
if (!empty($result['success'])) {
    $ref_id = $result['data']['ref_id'];
    $paid_gold = $result['data']['paid_gold'];
    // ✅ پرداخت تأیید شد — سفارش تکمیل شود
}</pre>
            </div>
        </div>
        <?php
    }

    /**
     * AJAX: Test API connection
     */
    public function ajax_test_connection(): void
    {
        check_ajax_referer('zg_admin_nonce', 'nonce');

        $api = new ZG_API();

        if (!$api->is_configured()) {
            wp_send_json_error(['message' => 'لطفاً ابتدا کلید API و آدرس سرور را تنظیم کنید']);
        }

        // Test with gold price endpoint
        $result = $api->get_gold_price();

        if (is_wp_error($result)) {
            wp_send_json_error([
                'message' => $result->get_error_message(),
                'data'    => $result->get_error_data(),
            ]);
        }

        wp_send_json_success([
            'message' => 'اتصال برقرار شد!',
            'data'    => $result,
        ]);
    }

    /**
     * AJAX: Fetch payment stats
     */
    public function ajax_fetch_stats(): void
    {
        check_ajax_referer('zg_admin_nonce', 'nonce');

        $api = new ZG_API();

        if (!$api->is_configured()) {
            wp_send_json_error(['message' => 'کلید API تنظیم نشده']);
        }

        $result = $api->get_history(['limit' => 10, 'page' => 1]);

        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()]);
        }

        wp_send_json_success($result);
    }
}
