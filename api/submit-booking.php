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

if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate) || strtotime($checkOutDate) <= strtotime($checkInDate)) {
    json_response(false, 'Please enter valid check-in and check-out dates.', 422);
}

if ($guests > 20) {
    json_response(false, 'Please enter a valid number of guests.', 422);
}

$amount = calculate_booking_amount($roomName, $checkInDate, $checkOutDate);

try {
    $pdo = get_db_connection();

    $conflict = $pdo->prepare(
        "SELECT id, check_in_date, check_out_date
         FROM bookings
         WHERE room_name = :room_name
           AND status = 'Confirmed'
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
        (full_name, email, phone, room_name, check_in_date, check_out_date, guests, message, status, payment_status, amount, currency, ip_address, user_agent, created_at, updated_at)
        VALUES
        (:full_name, :email, :phone, :room_name, :check_in_date, :check_out_date, :guests, :message, :status, :payment_status, :amount, :currency, :ip_address, :user_agent, NOW(), NOW())'
    );
    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone,
        ':room_name' => $roomName,
        ':check_in_date' => $checkInDate,
        ':check_out_date' => $checkOutDate,
        ':guests' => $guests,
        ':message' => $message,
        ':status' => 'Pending',
        ':payment_status' => 'Payment Pending',
        ':amount' => $amount,
        ':currency' => 'LKR',
        ':ip_address' => get_client_ip(),
        ':user_agent' => mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);

    $bookingId = (int) $pdo->lastInsertId();

    send_plain_email(ADMIN_EMAIL, 'New Booking Inquiry - BK-' . str_pad((string) $bookingId, 5, '0', STR_PAD_LEFT), "A new booking inquiry has been received.

Guest: {$fullName}
Email: {$email}
Phone: {$phone}
Room: {$roomName}
Check-in: {$checkInDate}
Check-out: {$checkOutDate}
Guests: {$guests}", $email);
    send_plain_email($email, 'Booking Inquiry Received - Jebal Homes', "Dear {$fullName},

We received your booking inquiry for {$roomName}. We will contact you soon.

Regards,
Jebal Homes");

    json_response(true, 'Booking inquiry submitted successfully.', 201, [
        'data' => [
            'booking_id' => $bookingId,
            'booking_no' => 'BK-' . str_pad((string) $bookingId, 5, '0', STR_PAD_LEFT),
            'amount' => $amount,
            'currency' => 'LKR',
        ],
    ]);
} catch (Throwable $e) {
    error_log('Booking submit error: ' . $e->getMessage());
    json_response(false, 'Unable to submit booking inquiry.', 500);
}
