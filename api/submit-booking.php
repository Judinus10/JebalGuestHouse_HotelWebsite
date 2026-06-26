<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

apply_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

rate_limit_or_fail('submit_booking', 6, 15);

$data = read_request_data();
$fullName = clean_string($data['full_name'] ?? '', 150);
$email = strtolower(clean_string($data['email'] ?? '', 190));
$phone = clean_string($data['phone'] ?? '', 50);
$isBookingForOther = !empty($data['is_booking_for_other']) && filter_var($data['is_booking_for_other'], FILTER_VALIDATE_BOOLEAN);
$stayingGuestName = clean_string($data['staying_guest_name'] ?? '', 150);
$stayingGuestEmail = strtolower(clean_string($data['staying_guest_email'] ?? '', 190));
$stayingGuestPhone = clean_string($data['staying_guest_phone'] ?? '', 50);
$stayingGuestNote = clean_string($data['staying_guest_note'] ?? '', 3000);
$roomName = clean_string($data['room_name'] ?? '', 150);
$checkInDate = clean_string($data['check_in_date'] ?? '', 20);
$checkOutDate = clean_string($data['check_out_date'] ?? '', 20);
$guests = (int) ($data['guests'] ?? 0);
$message = clean_string($data['message'] ?? '', 3000);

if ($fullName === '' || $email === '' || $phone === '' || $roomName === '' || $checkInDate === '' || $checkOutDate === '' || $guests < 1) {
    json_response(false, 'Please fill in all required fields.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Please enter a valid email address.', 422);
}

if ($isBookingForOther && ($stayingGuestName === '' || $stayingGuestPhone === '')) {
    json_response(false, 'Please fill in the staying guest name and phone number.', 422);
}

if ($stayingGuestEmail !== '' && !filter_var($stayingGuestEmail, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Please enter a valid staying guest email address.', 422);
}

if (!$isBookingForOther) {
    $stayingGuestName = '';
    $stayingGuestEmail = '';
    $stayingGuestPhone = '';
    $stayingGuestNote = '';
}

if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate)) {
    json_response(false, 'Please enter valid check-in and check-out dates.', 422);
}

$today = new DateTimeImmutable('today');
$checkIn = DateTimeImmutable::createFromFormat('Y-m-d', $checkInDate);
$checkOut = DateTimeImmutable::createFromFormat('Y-m-d', $checkOutDate);

if (!$checkIn || !$checkOut) {
    json_response(false, 'Please enter valid check-in and check-out dates.', 422);
}

if ($checkIn < $today) {
    json_response(false, 'Check-in date cannot be in the past.', 422);
}

if ($checkOut <= $checkIn) {
    json_response(false, 'Check-out date must be after check-in date.', 422);
}

if ($guests > 20) {
    json_response(false, 'Please enter a valid number of guests.', 422);
}

$amount = calculate_booking_amount($roomName, $checkInDate, $checkOutDate);

if ($amount <= 0) {
    json_response(false, 'Unable to calculate booking amount for the selected room.', 422);
}

try {
    $pdo = get_db_connection();

    $roomStmt = $pdo->prepare("SELECT id, max_guests, status FROM rooms WHERE room_name = :room_name LIMIT 1");
    $roomStmt->execute([':room_name' => $roomName]);
    $room = $roomStmt->fetch();

    if (!$room || ($room['status'] ?? '') !== 'Available') {
        json_response(false, 'Please select a valid available room.', 422);
    }

    if ($guests > (int) ($room['max_guests'] ?? 0)) {
        json_response(false, 'Selected room cannot hold this number of guests.', 422);
    }

    $conflict = $pdo->prepare(
        "SELECT id, check_in_date, check_out_date
         FROM bookings
         WHERE room_name = :room_name
           AND status IN ('Confirmed', 'Pending')
           AND COALESCE(payment_status, '') NOT IN ('Failed', 'Cancelled', 'Refunded')
           AND :requested_check_in < check_out_date
           AND :requested_check_out > check_in_date
         LIMIT 1"
    );
    $conflict->execute([
        ':room_name' => $roomName,
        ':requested_check_in' => $checkInDate,
        ':requested_check_out' => $checkOutDate,
    ]);

    if ($conflict->fetch()) {
        json_response(false, 'Sorry, this room is not available for the selected dates.', 409, ['available' => false]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO bookings
        (full_name, email, phone, is_booking_for_other, staying_guest_name, staying_guest_email, staying_guest_phone, staying_guest_note, room_name, check_in_date, check_out_date, guests, message, status, payment_status, amount, currency, ip_address, user_agent, created_at, updated_at)
        VALUES
        (:full_name, :email, :phone, :is_booking_for_other, :staying_guest_name, :staying_guest_email, :staying_guest_phone, :staying_guest_note, :room_name, :check_in_date, :check_out_date, :guests, :message, :status, :payment_status, :amount, :currency, :ip_address, :user_agent, NOW(), NOW())'
    );
    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone,
        ':is_booking_for_other' => $isBookingForOther ? 1 : 0,
        ':staying_guest_name' => $stayingGuestName !== '' ? $stayingGuestName : null,
        ':staying_guest_email' => $stayingGuestEmail !== '' ? $stayingGuestEmail : null,
        ':staying_guest_phone' => $stayingGuestPhone !== '' ? $stayingGuestPhone : null,
        ':staying_guest_note' => $stayingGuestNote !== '' ? $stayingGuestNote : null,
        ':room_name' => $roomName,
        ':check_in_date' => $checkInDate,
        ':check_out_date' => $checkOutDate,
        ':guests' => $guests,
        ':message' => $message,
        ':status' => 'Pending',
        ':payment_status' => 'Payment Pending',
        ':amount' => $amount,
        ':currency' => PAYMENT_CURRENCY,
        ':ip_address' => get_client_ip(),
        ':user_agent' => mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);

    $bookingId = (int) $pdo->lastInsertId();

    send_plain_email(ADMIN_EMAIL, 'New Booking Inquiry - BK-' . str_pad((string) $bookingId, 5, '0', STR_PAD_LEFT), "A new booking inquiry has been received.\n\nGuest: {$fullName}\nEmail: {$email}\nPhone: {$phone}\nRoom: {$roomName}\nCheck-in: {$checkInDate}\nCheck-out: {$checkOutDate}\nGuests: {$guests}", $email);
    send_plain_email($email, 'Booking Inquiry Received - Jebal Homes', "Dear {$fullName},\n\nWe received your booking inquiry for {$roomName}. Please complete the payment step to confirm your reservation.\n\nRegards,\nJebal Homes");

    json_response(true, 'Booking inquiry submitted successfully.', 201, [
        'inquiry_id' => $bookingId,
        'booking_id' => $bookingId,
        'booking_no' => 'BK-' . str_pad((string) $bookingId, 5, '0', STR_PAD_LEFT),
        'amount' => $amount,
        'currency' => PAYMENT_CURRENCY,
        'data' => [
            'booking_id' => $bookingId,
            'booking_no' => 'BK-' . str_pad((string) $bookingId, 5, '0', STR_PAD_LEFT),
            'amount' => $amount,
            'currency' => PAYMENT_CURRENCY,
        ],
    ]);
} catch (Throwable $e) {
    error_log('Booking submit error: ' . $e->getMessage());
    json_response(false, 'Unable to submit booking inquiry.', 500);
}
