/**
 * Zarrin Gold — Admin JavaScript
 */

(function ($) {
    'use strict';

    // Test Connection
    $('#zg-test-btn').on('click', function () {
        var $btn = $(this);
        var $result = $('#zg-test-result');
        var $output = $('#zg-test-output');

        $btn.prop('disabled', true).text(zgAdmin.strings.testing);
        $result.removeClass('zg-hidden');
        $output.text('...');

        $.post(zgAdmin.ajaxUrl, {
            action: 'zg_test_connection',
            nonce: zgAdmin.nonce,
        })
        .done(function (response) {
            if (response.success) {
                $output.text(JSON.stringify(response.data, null, 2));
                $output.addClass('zg-success');
            } else {
                $output.text(JSON.stringify(response.data, null, 2));
                $output.addClass('zg-error');
            }
        })
        .fail(function (xhr) {
            $output.text('HTTP Error: ' + xhr.status);
            $output.addClass('zg-error');
        })
        .always(function () {
            $btn.prop('disabled', false).text('تست اتصال');
        });
    });

    // Fetch Stats
    $('#zg-stats-btn').on('click', function () {
        var $btn = $(this);
        var $card = $('#zg-stats-card');
        var $output = $('#zg-stats-output');

        $btn.prop('disabled', true).text(zgAdmin.strings.loading);
        $card.removeClass('zg-hidden');
        $output.html('<p>' + zgAdmin.strings.loading + '</p>');

        $.post(zgAdmin.ajaxUrl, {
            action: 'zg_fetch_stats',
            nonce: zgAdmin.nonce,
        })
        .done(function (response) {
            if (response.success && response.data && response.data.data) {
                var data = response.data.data;
                var summary = data.summary || {};
                var payments = data.payments || [];

                var html = '<div class="zg-stats-grid">';
                html += '<div class="zg-stat-item"><span class="zg-stat-number">' + (summary.paidCount || 0) + '</span><span class="zg-stat-label">تراکنش موفق</span></div>';
                html += '<div class="zg-stat-item"><span class="zg-stat-number">' + formatGold(summary.totalGold || 0) + '</span><span class="zg-stat-label">طلای دریافتی (گرم)</span></div>';
                html += '<div class="zg-stat-item"><span class="zg-stat-number">' + formatNumber(summary.totalPaid || 0) + '</span><span class="zg-stat-label">مجموع مبلغ (تومان)</span></div>';
                html += '<div class="zg-stat-item"><span class="zg-stat-number">' + formatNumber(summary.totalFees || 0) + '</span><span class="zg-stat-label">کارمزد (تومان)</span></div>';
                html += '</div>';

                if (payments.length > 0) {
                    html += '<table class="wp-list-table widefat fixed striped"><thead><tr>';
                    html += '<th>کد تراکنش</th><th>مبلغ (تومان)</th><th>طلای پرداختی</th><th>وضعیت</th><th>تاریخ</th>';
                    html += '</tr></thead><tbody>';
                    payments.forEach(function (p) {
                        html += '<tr>';
                        html += '<td><code>' + (p.refId || p.authority || '—').substring(0, 20) + '</code></td>';
                        html += '<td>' + formatNumber(p.amountToman || 0) + '</td>';
                        html += '<td>' + formatGold(p.goldGrams || 0) + ' گرم</td>';
                        html += '<td>' + statusBadge(p.status) + '</td>';
                        html += '<td>' + (p.createdAt || '—').substring(0, 16) + '</td>';
                        html += '</tr>';
                    });
                    html += '</tbody></table>';
                }

                $output.html(html);
            } else {
                $output.html('<p>اطلاعاتی یافت نشد</p>');
            }
        })
        .fail(function (xhr) {
            $output.html('<p class="zg-error">خطا: ' + xhr.status + '</p>');
        })
        .always(function () {
            $btn.prop('disabled', false).text('آمار تراکنش‌ها');
        });
    });

    function formatNumber(n) {
        return Number(n).toLocaleString('fa-IR');
    }

    function formatGold(n) {
        return Number(n).toFixed(3);
    }

    function statusBadge(status) {
        var colors = {
            paid: '#22c55e',
            pending: '#f59e0b',
            failed: '#ef4444',
            expired: '#94a3b8',
        };
        var labels = {
            paid: 'پرداخت شده',
            pending: 'در انتظار',
            failed: 'ناموفق',
            expired: 'منقضی',
        };
        var color = colors[status] || '#94a3b8';
        var label = labels[status] || status;
        return '<span style="background:' + color + '22;color:' + color + ';padding:2px 10px;border-radius:4px;font-size:12px;">' + label + '</span>';
    }
})(jQuery);
