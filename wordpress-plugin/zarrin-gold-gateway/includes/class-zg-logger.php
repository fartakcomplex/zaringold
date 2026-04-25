<?php
/**
 * Zarrin Gold — Logger
 *
 * Writes debug/info/error logs to WooCommerce logs or a custom log file.
 */

if (!defined('ABSPATH')) {
    exit;
}

class ZG_Logger
{
    /**
     * Log a message
     *
     * @param string $message Log message
     * @param mixed  $data    Optional extra data (will be JSON encoded)
     * @param string $level   'info' | 'error' | 'debug'
     */
    public static function log(string $message, $data = null, string $level = 'info'): void
    {
        $debug = get_option('zg_debug_mode', 'no') === 'yes';
        if (!$debug && $level === 'debug') {
            return;
        }

        $entry = sprintf(
            "[%s][%s] %s",
            current_time('Y-m-d H:i:s'),
            strtoupper($level),
            $message
        );

        if ($data !== null) {
            $entry .= ' | ' . (is_string($data) ? $data : wp_json_encode($data, JSON_UNESCAPED_UNICODE));
        }

        // Try WooCommerce logger first
        if (function_exists('wc_get_logger')) {
            $logger = wc_get_logger();
            $logger->log($level, $entry, ['source' => 'zarrin-gold']);
            return;
        }

        // Fallback: write to wp-content/debug.log
        self::write_to_file($entry);
    }

    /**
     * Write to custom log file
     */
    private static function write_to_file(string $entry): void
    {
        $upload_dir = wp_upload_dir();
        $log_dir    = $upload_dir['basedir'] . '/zarrin-gold-logs';

        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
        }

        $log_file = $log_dir . '/gateway-' . date('Y-m') . '.log';
        $entry    .= PHP_EOL;

        // Prevent concurrent writes
        if (function_exists('file_put_contents')) {
            @file_put_contents($log_file, $entry, FILE_APPEND | LOCK_EX);
        }
    }
}
