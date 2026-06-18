<?php
/**
 * Room availability check endpoint.
 *
 * This endpoint does not save anything. It only checks whether selected dates
 * are blocked by Confirmed bookings.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();

$roomName = clean_string($data['room_name'] ?? '');
$checkInDate = clean_string($data['check_in_date'] ?? '');
$checkOutDate = clean_string($data['check_out_date'] ?? '');

if ($roomName === '' || $checkInDate === '' || $checkOutDate === '') {
    api_json_response(false, 'Room name, check-in date, and check-out date are required.', 422);
}

if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate)) {
    api_json_response(false, 'Please enter valid check-in and check-out dates.', 422);
}

if (strtotime($checkOutDate) <= strtotime($checkInDate)) {
    api_json_response(false, 'Check-out date must be after check-in date.', 422);
}

try {
    $pdo = get_db_connection();

    $statement = $pdo->prepare(
        "SELECT id, check_in_date, check_out_date
         FROM booking_inquiries
         WHERE room_name = :room_name
           AND LOWER(status) = 'confirmed'
           AND :requested_check_in < check_out_date
           AND :requested_check_out > check_in_date
         LIMIT 1"
    );

    $statement->execute([
        ':room_name' => $roomName,
        ':requested_check_in' => $checkInDate,
        ':requested_check_out' => $checkOutDate,
    ]);

    $conflict = $statement->fetch();

    if ($conflict) {
        api_json_response(true, 'Room is not available for the selected dates.', 200, [
            'available' => false,
            'conflict' => [
                'check_in_date' => $conflict['check_in_date'],
                'check_out_date' => $conflict['check_out_date'],
            ],
        ]);
    }

    api_json_response(true, 'Room is available for the selected dates.', 200, [
        'available' => true,
    ]);
} catch (Throwable $e) {
    error_log('Availability check error: ' . $e->getMessage());
    api_json_response(false, 'Unable to check availability. Please try again later.', 500);
}
