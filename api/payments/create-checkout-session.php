<?php
/**
 * Creates a PayHere checkout session for an existing booking.
 * This endpoint never trusts frontend amount values. It recalculates amount from
 * the saved booking room name and stay dates using backend ROOM_RATES.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

apply_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

rate_limit_or_fail('create_checkout_session', 10, 15);

function payhere_format_amount(float $amount): string
{
    return number_format($amount, 2, '.', '');
}

function create_checkout_token(string $orderId, int $bookingId, string $amount): string
{
    return hash_hmac('sha256', $orderId . '|' . $bookingId . '|' . $amount, PAYHERE_MERCHANT_SECRET);
}

$data = read_request_data();
$bookingId = (int) ($data['booking_id'] ?? $data['inquiry_id'] ?? 0);

if ($bookingId < 1) {
    json_response(false, 'Valid booking ID is required to start payment.', 422);
}

if (PAYHERE_MERCHANT_ID === '' || PAYHERE_MERCHANT_SECRET === '' || PAYHERE_MERCHANT_ID === 'YOUR_PAYHERE_MERCHANT_ID' || PAYHERE_MERCHANT_SECRET === 'YOUR_PAYHERE_MERCHANT_SECRET') {
    json_response(false, 'PayHere credentials are not configured on the backend.', 500);
}

try {
    $pdo = get_db_connection();
    $pdo->beginTransaction();

    $bookingStmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE');
    $bookingStmt->execute([':id' => $bookingId]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        json_response(false, 'Booking was not found.', 404);
    }

    if (($booking['payment_status'] ?? '') === 'Paid') {
        $pdo->rollBack();
        json_response(false, 'This booking has already been paid.', 409);
    }

    $roomName = (string) ($booking['room_name'] ?? '');
    $checkInDate = (string) ($booking['check_in_date'] ?? '');
    $checkOutDate = (string) ($booking['check_out_date'] ?? '');

    if (!array_key_exists($roomName, ROOM_RATES)) {
        $pdo->rollBack();
        json_response(false, 'Booking contains an invalid room name.', 422);
    }

    if (!is_valid_date($checkInDate) || !is_valid_date($checkOutDate)) {
        $pdo->rollBack();
        json_response(false, 'Booking contains invalid dates.', 422);
    }

    $checkIn = DateTimeImmutable::createFromFormat('Y-m-d', $checkInDate);
    $checkOut = DateTimeImmutable::createFromFormat('Y-m-d', $checkOutDate);
    $today = new DateTimeImmutable('today');

    if (!$checkIn || !$checkOut || $checkIn < $today || $checkOut <= $checkIn) {
        $pdo->rollBack();
        json_response(false, 'Booking dates are no longer valid for payment.', 422);
    }

    $amount = calculate_booking_amount($roomName, $checkInDate, $checkOutDate);

    if ($amount <= 0) {
        $pdo->rollBack();
        json_response(false, 'Unable to calculate payment amount.', 422);
    }

    $amountFormatted = payhere_format_amount($amount);
    $currency = PAYMENT_CURRENCY;
    $orderId = 'JH-' . date('YmdHis') . '-' . str_pad((string) $bookingId, 5, '0', STR_PAD_LEFT);

    $checkoutPayload = [
        'merchant_id' => PAYHERE_MERCHANT_ID,
        'return_url' => (APP_BASE_URL !== '' ? APP_BASE_URL : '') . '/rooms',
        'cancel_url' => (APP_BASE_URL !== '' ? APP_BASE_URL : '') . '/rooms',
        'notify_url' => (API_BASE_URL !== '' ? API_BASE_URL : '') . '/payments/payhere-notify.php',
        'order_id' => $orderId,
        'items' => 'Jebal Homes booking #' . $bookingId . ' - ' . $roomName,
        'currency' => $currency,
        'amount' => $amountFormatted,
        'first_name' => (string) ($booking['full_name'] ?? 'Guest'),
        'last_name' => '',
        'email' => (string) ($booking['email'] ?? ''),
        'phone' => (string) ($booking['phone'] ?? ''),
        'address' => '',
        'city' => '',
        'country' => 'Sri Lanka',
        'custom_1' => (string) $bookingId,
        'custom_2' => '',
    ];

    $checkoutPayload['hash'] = strtoupper(md5(
        PAYHERE_MERCHANT_ID .
        $orderId .
        $amountFormatted .
        $currency .
        strtoupper(md5(PAYHERE_MERCHANT_SECRET))
    ));

    $insertPayment = $pdo->prepare(
        'INSERT INTO payments (booking_id, order_id, amount, currency, status, method, gateway_response, created_at, updated_at)
         VALUES (:booking_id, :order_id, :amount, :currency, :status, :method, :gateway_response, NOW(), NOW())'
    );
    $insertPayment->execute([
        ':booking_id' => $bookingId,
        ':order_id' => $orderId,
        ':amount' => $amount,
        ':currency' => $currency,
        ':status' => 'Payment Pending',
        ':method' => 'PayHere',
        ':gateway_response' => json_encode([
            'checkout_created_at' => date('Y-m-d H:i:s'),
            'checkout_payload' => $checkoutPayload,
        ], JSON_UNESCAPED_SLASHES),
    ]);

    $updateBooking = $pdo->prepare('UPDATE bookings SET amount = :amount, currency = :currency, payment_status = :payment_status, updated_at = NOW() WHERE id = :id');
    $updateBooking->execute([
        ':amount' => $amount,
        ':currency' => $currency,
        ':payment_status' => 'Payment Pending',
        ':id' => $bookingId,
    ]);

    $pdo->commit();

    $token = create_checkout_token($orderId, $bookingId, $amountFormatted);
    $baseApiUrl = API_BASE_URL !== '' ? API_BASE_URL : rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/payments')), '/');
    $checkoutUrl = $baseApiUrl . '/payments/payhere-redirect.php?order_id=' . rawurlencode($orderId) . '&booking_id=' . $bookingId . '&token=' . rawurlencode($token);

    json_response(true, 'PayHere checkout session created.', 200, [
        'checkout_url' => $checkoutUrl,
        'order_id' => $orderId,
        'amount' => $amountFormatted,
        'currency' => $currency,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Create checkout session error: ' . $e->getMessage());
    json_response(false, 'Unable to start payment checkout.', 500);
}
