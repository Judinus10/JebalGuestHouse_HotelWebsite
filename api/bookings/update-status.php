<?php
/**
 * Updates booking status from admin.
 * Confirmed bookings block availability. Pending and Cancelled bookings do not block availability.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();
$id = (int) ($data['id'] ?? 0);
$status = strtolower(clean_string($data['status'] ?? ''));
$allowedStatuses = ['pending', 'confirmed', 'cancelled'];

if ($id < 1 || !in_array($status, $allowedStatuses, true)) {
    api_json_response(false, 'Valid booking ID and status are required.', 422);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->prepare('SELECT * FROM booking_inquiries WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        api_json_response(false, 'Booking was not found.', 404);
    }

    if ($status === 'confirmed') {
        $conflictStatement = $pdo->prepare(
            "SELECT id
             FROM booking_inquiries
             WHERE id <> :id
               AND room_name = :room_name
               AND LOWER(status) = 'confirmed'
               AND :requested_check_in < check_out_date
               AND :requested_check_out > check_in_date
             LIMIT 1"
        );

        $conflictStatement->execute([
            ':id' => $id,
            ':room_name' => $booking['room_name'],
            ':requested_check_in' => $booking['check_in_date'],
            ':requested_check_out' => $booking['check_out_date'],
        ]);

        if ($conflictStatement->fetch()) {
            api_json_response(false, 'Cannot confirm this booking because the room is already confirmed for overlapping dates.', 409);
        }
    }

    $normalizedStatus = normalize_booking_status($status);

    $update = $pdo->prepare(
        'UPDATE booking_inquiries
         SET status = :status, updated_at = NOW()
         WHERE id = :id'
    );

    $update->execute([
        ':status' => $normalizedStatus,
        ':id' => $id,
    ]);

    api_json_response(true, 'Booking status updated successfully.', 200, [
        'data' => [
            'id' => $id,
            'booking_status' => strtolower($normalizedStatus),
        ],
    ]);
} catch (Throwable $e) {
    error_log('Admin update booking status error: ' . $e->getMessage());
    api_json_response(false, 'Unable to update booking status.', 500);
}
