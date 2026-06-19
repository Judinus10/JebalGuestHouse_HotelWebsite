<?php
/**
 * Admin payments list endpoint.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

apply_cors_headers();
require_admin_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(false, 'Only GET requests are allowed.', 405);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->query(
        "SELECT
            p.id,
            p.booking_id,
            CONCAT('BK-', LPAD(COALESCE(p.booking_id, 0), 5, '0')) AS booking_no,
            COALESCE(b.full_name, 'Unknown Guest') AS guest_name,
            COALESCE(b.email, '') AS guest_email,
            COALESCE(b.room_name, '-') AS room_name,
            p.order_id,
            p.payment_id,
            p.amount,
            p.currency,
            p.status AS payment_status,
            p.method AS payment_method,
            'PayHere' AS payment_gateway,
            COALESCE(NULLIF(p.payment_id, ''), NULLIF(p.order_id, ''), CONCAT('PAY-', LPAD(p.id, 4, '0'))) AS transaction_id,
            p.gateway_response,
            p.invoice_id,
            COALESCE(p.invoice_number, b.invoice_number, '') AS invoice_number,
            COALESCE(b.invoice_file_path, '') AS invoice_file_path,
            COALESCE(b.email_status, 'Pending') AS email_status,
            CASE WHEN p.status = 'Paid' THEN p.updated_at ELSE NULL END AS paid_at,
            p.created_at,
            p.updated_at
         FROM payments p
         LEFT JOIN bookings b ON b.id = p.booking_id
         ORDER BY p.created_at DESC"
    );

    json_response(true, 'Payments loaded successfully.', 200, [
        'data' => $stmt->fetchAll(),
    ]);
} catch (Throwable $e) {
    error_log('Admin payments list error: ' . $e->getMessage());
    json_response(false, 'Unable to load payments.', 500);
}