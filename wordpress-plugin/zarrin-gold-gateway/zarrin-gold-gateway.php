<?php
/**
 * Plugin Name: Zarrin Gold Payment Gateway (درگاه پرداخت زرین گلد)
 * Plugin URI: https://zarringold.ir/wordpress-plugin
 * Description: پلاگین درگاه پرداخت طلایی زرین گلد برای ووکامرس — پرداخت بر اساس گرم طلا، بدون ریال و تومان
 * Version: 1.0.0
 * Author: Zarrin Gold Team
 * Author URI: https://zarringold.ir
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: zarrin-gold-gateway
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 9.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ZARRIN_GOLD_VERSION', '1.0.0');
define('ZARRIN_GOLD_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ZARRIN_GOLD_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * ─── Autoload includes ───
 */
require_once ZARRIN_GOLD_PLUGIN_DIR . 'includes/class-zg-logger.php';
require_once ZARRIN_GOLD_PLUGIN_DIR . 'includes/class-zg-api.php';
require_once ZARRIN_GOLD_PLUGIN_DIR . 'includes/class-zg-gateway.php';
require_once ZARRIN_GOLD_PLUGIN_DIR . 'admin/class-zg-admin-settings.php';

/**
 * ─── Initialize plugin ───
 */
add_action('plugins_loaded', 'zarrin_gold_gateway_init', 11);

function zarrin_gold_gateway_init()
{
    if (!class_exists('WC_Payment_Gateway')) {
        add_action('admin_notices', function () {
            echo '<div class="error"><p>';
            esc_html_e('درگاه زرین گلد به ووکامرس نیاز دارد. لطفاً ابتدا ووکامرس را نصب و فعال کنید.', 'zarrin-gold-gateway');
            echo '</p></div>';
        });
        return;
    }

    load_plugin_textdomain('zarrin-gold-gateway', false, dirname(plugin_basename(__FILE__)) . '/languages');

    // Register gateway with WooCommerce
    add_filter('woocommerce_payment_gateways', function ($gateways) {
        $gateways[] = 'ZG_Gateway';
        return $gateways;
    });

    // Initialize gateway
    new ZG_Gateway();
    new ZG_Admin_Settings();
}

/**
 * ─── Plugin activation hook ───
 */
register_activation_hook(__FILE__, function () {
    $defaults = [
        'zg_api_key'           => '',
        'zg_api_base'          => '',
        'zg_enabled'           => 'no',
        'zg_payment_mode'      => 'gold',       // gold | toman | mixed
        'zg_gold_percent'      => '100',         // for mixed mode
        'zg_title'             => __('پرداخت با طلا (زرین گلد)', 'zarrin-gold-gateway'),
        'zg_description'       => __('پرداخت امن و سریع بر اساس گرم طلا', 'zarrin-gold-gateway'),
        'zg_webhook_secret'    => wp_generate_password(32, false, false),
        'zg_order_status'      => 'processing',
        'zg_debug_mode'        => 'no',
    ];

    foreach ($defaults as $key => $value) {
        if (get_option($key) === false) {
            add_option($key, $value);
        }
    }

    // Schedule cleanup cron
    if (!wp_next_scheduled('zg_cleanup_expired_tokens')) {
        wp_schedule_event(time(), 'hourly', 'zg_cleanup_expired_tokens');
    }
});

/**
 * ─── Plugin deactivation hook ───
 */
register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('zg_cleanup_expired_tokens');
});
