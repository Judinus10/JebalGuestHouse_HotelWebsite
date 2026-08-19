<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/bookings/booking-expiry-helper.php';
require_once __DIR__ . '/calendar/ics-helper.php';

apply_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

rate_limit_or_fail('check_availability', 30, 15);

$data = read_request_data();
$roomId = (int) ($data['room_id'] ?? 0);
$roomName = clean_string($data['room_name'] ?? '', 150);
$checkInDate = clean_string($data['check_in_date'] ?? '', 20);
$checkOutDate = clean_string($data['check_out_date'] ?? '', 20);
$guests = (int) ($data['guests'] ?? 0);

if (($roomId < 1 && $roomName === '') || $checkInDate === '' || $checkOutDate === '') {
    json_response(false, 'Room, check-in date, and check-out date are required.', 422);
}

if ($guests < 1 || $guests > 20) {
    json_response(false, 'Enter a valid number of guests.', 422);
}

if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate) || strtotime($checkOutDate) < strtotime($checkInDate)) {
    json_response(false, 'Enter valid check-in and check-out dates.', 422);
}

$availabilityCheckOutDate = $checkOutDate;
if ($checkOutDate === $checkInDate) {
    $availabilityCheckOutDate = (new DateTimeImmutable($checkInDate))->modify('+1 day')->format('Y-m-d');
}

try {
    $pdo = get_db_connection();
    expire_pending_bookings($pdo, null, false);

    if ($roomId > 0) {
        $roomStmt = $pdo->prepare('SELECT id, room_name, max_guests, status FROM rooms WHERE id = :id LIMIT 1');
        $roomStmt->execute([':id' => $roomId]);
        $room = $roomStmt->fetch();

        if (!$room) {
            json_response(false, 'This room is no longer available on our website. Please view the other rooms.', 404, ['error_code' => 'ROOM_NOT_FOUND']);
        }

        $roomName = (string) $room['room_name'];
        $roomId = (int) $roomId;
    } else {
        $roomStmt = $pdo->prepare('SELECT id, room_name, max_guests, status FROM rooms WHERE room_name = :room_name LIMIT 1');
        $roomStmt->execute([':room_name' => $roomName]);
        $room = $roomStmt->fetch();

        if (!$room) {
            json_response(false, 'This room is no longer available on our website. Please view the other rooms.', 404, ['error_code' => 'ROOM_NOT_FOUND']);
        }

        $roomId = (int) $room['id'];
    }

    if (($room['status'] ?? '') !== 'Available') {
        json_response(false, 'This room is not currently available for booking. Please choose another room.', 409, ['available' => false, 'error_code' => 'ROOM_UNAVAILABLE']);
    }

    $capacity = (int) ($room['max_guests'] ?? 0);
    if ($capacity < 1 || $guests > $capacity) {
        json_response(false, 'This room cannot accommodate the selected number of guests. Please reduce the guest count or choose multiple rooms.', 422, [
            'error_code' => 'ROOM_CAPACITY_EXCEEDED',
            'available' => false,
            'max_guests' => max(0, $capacity),
        ]);
    }

    $stmt = $pdo->prepare(
        "SELECT id, check_in_date, check_out_date, status, payment_status, created_at
         FROM bookings
         WHERE room_name = :room_name
           " . active_booking_conflict_sql() . "
           AND :requested_check_in < check_out_date
           AND :requested_check_out > check_in_date
         LIMIT 1"
    );
    $stmt->execute([
        ':room_name' => $roomName,
        ':hold_cutoff' => booking_hold_cutoff_datetime(),
        ':requested_check_in' => $checkInDate,
        ':requested_check_out' => $availabilityCheckOutDate,
    ]);
    $conflict = $stmt->fetch();

    if (!$conflict && $roomId > 0 && ics_room_conflict($pdo, $roomId, $checkInDate, $availabilityCheckOutDate)) {
        $conflict = ['source' => 'external'];
    }

    json_response(true, $conflict ? 'Room is unavailable for the selected dates.' : 'Room is available.', 200, [
        'available' => !$conflict,
        'room_name' => $roomName,
        'conflict' => $conflict ?: null,
    ]);
} catch (Throwable $e) {
    error_log('Availability check error: ' . $e->getMessage());
    json_response(false, 'Unable to check availability.', 500);
}
