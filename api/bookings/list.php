<?php
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
            id,
            CONCAT('BK-', LPAD(id, 5, '0')) AS booking_no,
            full_name AS guest_name,
            email AS guest_email,
            phone AS guest_phone,
            room_name,
            check_in_date,
            check_out_date,
            guests,
            message AS special_requests,
            LOWER(status) AS booking_status,
            payment_status,
            amount AS total_amount,
            currency AS payment_currency,
            invoice_number,
            invoice_file_path,
            email_status,
            created_at,
            updated_at
         FROM bookings
         ORDER BY created_at DESC"
    );

    json_response(true, 'Bookings loaded successfully.', 200, [
        'data' => $stmt->fetchAll(),
    ]);
} catch (Throwable $e) {
    error_log('Admin bookings list error: ' . $e->getMessage());
    json_response(false, 'Unable to load bookings.', 500);
}
