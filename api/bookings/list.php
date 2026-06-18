<?php
/**
 * Returns booking inquiries for the admin bookings page.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    api_json_response(false, 'Only GET requests are allowed.', 405);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->query(
        "SELECT
            id,
            full_name AS guest_name,
            email AS guest_email,
            phone AS guest_phone,
            room_name,
            check_in_date,
            check_out_date,
            guests,
            message AS special_requests,
            LOWER(status) AS booking_status,
            COALESCE(payment_status, 'pending') AS payment_status,
            COALESCE(amount, 0) AS total_amount,
            COALESCE(currency, 'LKR') AS payment_currency,
            created_at,
            updated_at
         FROM booking_inquiries
         ORDER BY created_at DESC"
    );

    api_json_response(true, 'Bookings loaded successfully.', 200, [
        'data' => $stmt->fetchAll(),
    ]);
} catch (Throwable $e) {
    error_log('Admin bookings list error: ' . $e->getMessage());
    api_json_response(false, 'Unable to load bookings.', 500);
}
