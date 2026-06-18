<?php
/**
 * Booking inquiry submission endpoint.
 *
 * Saves a booking inquiry only after checking confirmed-booking date conflicts.
 * Payment gateway integration is intentionally not included in this backend repair step.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();

$fullName = clean_string($data['full_name'] ?? $data['name'] ?? '');
$email = clean_string($data['email'] ?? '');
$phone = clean_string($data['phone'] ?? '');
$roomName = clean_string($data['room_name'] ?? '');
$checkInDate = clean_string($data['check_in_date'] ?? $data['checkIn'] ?? '');
$checkOutDate = clean_string($data['check_out_date'] ?? $data['checkOut'] ?? '');
$guests = (int) ($data['guests'] ?? 0);
$message = clean_string($data['message'] ?? $data['special_request'] ?? $data['special_requests'] ?? '');

if ($fullName === '' || $email === '' || $phone === '' || $roomName === '' || $checkInDate === '' || $checkOutDate === '' || $guests < 1) {
    api_json_response(false, 'Please fill in all required fields.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_json_response(false, 'Please enter a valid email address.', 422);
}

if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate)) {
    api_json_response(false, 'Please enter valid check-in and check-out dates.', 422);
}

if (strtotime($checkOutDate) <= strtotime($checkInDate)) {
    api_json_response(false, 'Check-out date must be after check-in date.', 422);
}

if ($guests > 20) {
    api_json_response(false, 'Please enter a valid number of guests.', 422);
}

$status = 'Pending';
$paymentStatus = 'pending';
$amount = calculate_booking_amount($roomName, $checkInDate, $checkOutDate);
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

try {
    $pdo = get_db_connection();

    $conflictStatement = $pdo->prepare(
        "SELECT id, check_in_date, check_out_date
         FROM booking_inquiries
         WHERE room_name = :room_name
           AND LOWER(status) = 'confirmed'
           AND :requested_check_in < check_out_date
           AND :requested_check_out > check_in_date
         LIMIT 1"
    );

    $conflictStatement->execute([
        ':room_name' => $roomName,
        ':requested_check_in' => $checkInDate,
        ':requested_check_out' => $checkOutDate,
    ]);

    $conflictingBooking = $conflictStatement->fetch();

    if ($conflictingBooking) {
        api_json_response(false, 'Sorry, this room is not available for the selected dates. Please choose another room or different dates.', 409, [
            'available' => false,
            'conflict' => [
                'check_in_date' => $conflictingBooking['check_in_date'],
                'check_out_date' => $conflictingBooking['check_out_date'],
            ],
        ]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO booking_inquiries
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
        ':status' => $status,
        ':payment_status' => $paymentStatus,
        ':amount' => $amount,
        ':currency' => DEFAULT_CURRENCY,
        ':ip_address' => $ipAddress,
        ':user_agent' => $userAgent,
    ]);

    $bookingId = (int) $pdo->lastInsertId();

    $adminSubject = 'New Booking Inquiry - Jebal Homes #' . $bookingId;
    $adminBody = "New booking inquiry received.\n\n"
        . "Inquiry ID: {$bookingId}\n"
        . "Status: {$status}\n"
        . "Name: {$fullName}\n"
        . "Email: {$email}\n"
        . "Phone: {$phone}\n"
        . "Room: {$roomName}\n"
        . "Check-in: {$checkInDate}\n"
        . "Check-out: {$checkOutDate}\n"
        . "Guests: {$guests}\n"
        . "Estimated amount: " . DEFAULT_CURRENCY . ' ' . number_format($amount, 2) . "\n\n"
        . "Message:\n" . ($message !== '' ? $message : 'No message provided.') . "\n";

    $customerSubject = 'We received your booking inquiry - Jebal Homes';
    $customerBody = "Dear {$fullName},\n\n"
        . "Thank you for contacting Jebal Homes. We have received your booking inquiry.\n\n"
        . "Room: {$roomName}\n"
        . "Check-in: {$checkInDate}\n"
        . "Check-out: {$checkOutDate}\n"
        . "Guests: {$guests}\n\n"
        . "Our team will contact you to confirm the booking.\n\n"
        . "Regards,\nJebal Homes";

    send_plain_email(ADMIN_EMAIL, $adminSubject, $adminBody, $email);
    send_plain_email($email, $customerSubject, $customerBody);

    api_json_response(true, 'Booking inquiry submitted successfully.', 200, [
        'available' => true,
        'booking_id' => $bookingId,
        'inquiry_id' => $bookingId,
        'status' => $status,
        'payment_status' => $paymentStatus,
        'amount' => $amount,
        'currency' => DEFAULT_CURRENCY,
    ]);
} catch (Throwable $e) {
    error_log('Booking inquiry error: ' . $e->getMessage());
    api_json_response(false, 'Something went wrong while submitting your inquiry. Please try again later.', 500);
}
