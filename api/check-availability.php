<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

apply_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

rate_limit_or_fail('check_availability', 20, 15);

$data = read_request_data();
$roomName = clean_string($data['room_name'] ?? '', 150);
$checkInDate = clean_string($data['check_in_date'] ?? '', 20);
$checkOutDate = clean_string($data['check_out_date'] ?? '', 20);

if ($roomName === '' || $checkInDate === '' || $checkOutDate === '') {
    json_response(false, 'Room name, check-in date, and check-out date are required.', 422);
}

if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate) || strtotime($checkOutDate) <= strtotime($checkInDate)) {
    json_response(false, 'Enter valid check-in and check-out dates.', 422);
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        "SELECT id, check_in_date, check_out_date
         FROM bookings
         WHERE room_name = :room_name
           AND status = 'Confirmed'
           AND :requested_check_in < check_out_date
           AND :requested_check_out > check_in_date
         LIMIT 1"
    );
    $stmt->execute([
        ':room_name' => $roomName,
        ':requested_check_in' => $checkInDate,
        ':requested_check_out' => $checkOutDate,
    ]);
    $conflict = $stmt->fetch();

    json_response(true, $conflict ? 'Room is unavailable for the selected dates.' : 'Room is available.', 200, [
        'available' => !$conflict,
        'conflict' => $conflict ?: null,
    ]);
} catch (Throwable $e) {
    error_log('Availability check error: ' . $e->getMessage());
    json_response(false, 'Unable to check availability.', 500);
}
