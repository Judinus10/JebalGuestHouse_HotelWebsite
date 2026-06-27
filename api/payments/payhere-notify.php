<?php
/**
 * PayHere server notification endpoint.
 * Database updates are transactional; email/invoice side effects are isolated so
 * webhook delivery does not crash because mail() or email logging failed.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../invoices/invoice-helper.php';
require_once __DIR__ . '/../mail/email-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Only POST allowed');
}

function notify_text_response(int $statusCode, string $message): void
{
    http_response_code($statusCode);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

function normalize_payhere_amount(string $amount): string
{
    return number_format((float) $amount, 2, '.', '');
}

$merchantId = clean_string($_POST['merchant_id'] ?? '', 100);
$orderId = clean_string($_POST['order_id'] ?? '', 100);
$paymentId = clean_string($_POST['payment_id'] ?? '', 100);
$payhereAmountRaw = clean_string($_POST['payhere_amount'] ?? '', 50);
$payhereAmount = normalize_payhere_amount($payhereAmountRaw);
$payhereCurrency = clean_string($_POST['payhere_currency'] ?? '', 10);
$statusCode = clean_string($_POST['status_code'] ?? '', 10);
$md5sig = strtoupper(clean_string($_POST['md5sig'] ?? '', 100));
$method = clean_string($_POST['method'] ?? 'PayHere', 60);
$statusMessage = clean_string($_POST['status_message'] ?? '', 500);
$bookingId = (int) clean_string($_POST['custom_1'] ?? '0', 20);

if ($merchantId === '' || $orderId === '' || $payhereAmountRaw === '' || $payhereCurrency === '' || $statusCode === '' || $md5sig === '') {
    notify_text_response(400, 'Missing required fields');
}

if (PAYHERE_MERCHANT_ID === '' || PAYHERE_MERCHANT_SECRET === '') {
    error_log('PayHere notify rejected: backend PayHere credentials are missing.');
    notify_text_response(500, 'Payment gateway is not configured');
}

$localHash = generate_payhere_notify_hash($merchantId, $orderId, $payhereAmount, $payhereCurrency, $statusCode, PAYHERE_MERCHANT_SECRET);

if (!hash_equals($localHash, $md5sig) || !hash_equals(PAYHERE_MERCHANT_ID, $merchantId)) {
    error_log('PayHere notify rejected: invalid signature for order ' . $orderId);
    notify_text_response(403, 'Invalid PayHere signature');
}

$statusMap = [
    '2' => 'Paid',
    '0' => 'Payment Pending',
    '-1' => 'Cancelled',
    '-2' => 'Failed',
    '-3' => 'Refunded',
];

$paymentStatus = $statusMap[$statusCode] ?? 'Failed';
$bookingStatus = $paymentStatus === 'Paid' ? 'Confirmed' : 'Pending';
$booking = null;

try {
    $pdo = get_db_connection();
    $pdo->beginTransaction();

    $paymentStmt = $pdo->prepare('SELECT * FROM payments WHERE order_id = :order_id LIMIT 1 FOR UPDATE');
    $paymentStmt->execute([':order_id' => $orderId]);
    $existingPayment = $paymentStmt->fetch();

    if ($existingPayment && $bookingId < 1) {
        $bookingId = (int) ($existingPayment['booking_id'] ?? 0);
    }

    if ($bookingId > 0) {
        $bookingStmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE');
        $bookingStmt->execute([':id' => $bookingId]);
        $booking = $bookingStmt->fetch() ?: null;
    }

    if (!$booking && $existingPayment && !empty($existingPayment['booking_id'])) {
        $bookingId = (int) $existingPayment['booking_id'];
        $bookingStmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE');
        $bookingStmt->execute([':id' => $bookingId]);
        $booking = $bookingStmt->fetch() ?: null;
    }

    if ($paymentStatus === 'Paid' && $booking) {
        $expectedAmount = normalize_payhere_amount((string) calculate_booking_amount((string) $booking['room_name'], (string) $booking['check_in_date'], (string) $booking['check_out_date']));
        $expectedCurrency = (string) ($booking['currency'] ?? PAYMENT_CURRENCY);

        if (!hash_equals($expectedAmount, $payhereAmount) || !hash_equals($expectedCurrency, $payhereCurrency)) {
            error_log('PayHere notify amount/currency mismatch for order ' . $orderId . '. Expected ' . $expectedAmount . ' ' . $expectedCurrency . ', received ' . $payhereAmount . ' ' . $payhereCurrency);
            $paymentStatus = 'Failed';
            $bookingStatus = 'Pending';
            $statusMessage = trim($statusMessage . ' Amount or currency mismatch.');
        }
    }

    $gatewayResponse = $_POST;
    $gatewayResponse['server_status_message'] = $statusMessage;

    if ($existingPayment) {
        $updatePayment = $pdo->prepare(
            'UPDATE payments
             SET booking_id = COALESCE(booking_id, :booking_id),
                 payment_id = :payment_id,
                 amount = :amount,
                 currency = :currency,
                 status = :status,
                 method = :method,
                 gateway_response = :gateway_response,
                 updated_at = NOW()
             WHERE order_id = :order_id'
        );
        $updatePayment->execute([
            ':booking_id' => $bookingId ?: null,
            ':payment_id' => $paymentId ?: null,
            ':amount' => (float) $payhereAmount,
            ':currency' => $payhereCurrency,
            ':status' => $paymentStatus,
            ':method' => $method ?: 'PayHere',
            ':gateway_response' => json_encode($gatewayResponse, JSON_UNESCAPED_SLASHES),
            ':order_id' => $orderId,
        ]);
    } else {
        $insertPayment = $pdo->prepare(
            'INSERT INTO payments (booking_id, order_id, payment_id, amount, currency, status, method, gateway_response, created_at, updated_at)
             VALUES (:booking_id, :order_id, :payment_id, :amount, :currency, :status, :method, :gateway_response, NOW(), NOW())'
        );
        $insertPayment->execute([
            ':booking_id' => $bookingId ?: null,
            ':order_id' => $orderId,
            ':payment_id' => $paymentId ?: null,
            ':amount' => (float) $payhereAmount,
            ':currency' => $payhereCurrency,
            ':status' => $paymentStatus,
            ':method' => $method ?: 'PayHere',
            ':gateway_response' => json_encode($gatewayResponse, JSON_UNESCAPED_SLASHES),
        ]);
    }

    if ($bookingId > 0 && $booking) {
        if ($bookingStatus === 'Confirmed') {
            $conflictStatement = $pdo->prepare(
                "SELECT blocker.id
                 FROM bookings current_booking
                 INNER JOIN bookings blocker
                   ON blocker.room_name = current_booking.room_name
                  AND blocker.id <> current_booking.id
                  AND blocker.status = 'Confirmed'
                  AND current_booking.check_in_date < blocker.check_out_date
                  AND current_booking.check_out_date > blocker.check_in_date
                 WHERE current_booking.id = :booking_id
                 LIMIT 1"
            );
            $conflictStatement->execute([':booking_id' => $bookingId]);

            if ($conflictStatement->fetch()) {
                $bookingStatus = null;
                error_log('Paid booking has availability conflict and needs manual review. Booking ID: ' . $bookingId);
            }
        }

        $updateBookingSql = 'UPDATE bookings SET payment_status = :payment_status, amount = :amount, currency = :currency';
        $updateBookingParams = [
            ':payment_status' => $paymentStatus,
            ':amount' => (float) $payhereAmount,
            ':currency' => $payhereCurrency,
            ':id' => $bookingId,
        ];

        if ($bookingStatus !== null) {
            $updateBookingSql .= ', status = :status';
            $updateBookingParams[':status'] = $bookingStatus;
        }

        $updateBookingSql .= ', updated_at = NOW() WHERE id = :id';
        $updateBooking = $pdo->prepare($updateBookingSql);
        $updateBooking->execute($updateBookingParams);
    }

    $pdo->commit();
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('PayHere notify database error: ' . $e->getMessage());
    notify_text_response(500, 'Server error');
}

if ($bookingId > 0) {
    try {
        $freshBooking = get_booking_by_id($pdo, $bookingId);

        if ($freshBooking) {
            if ($paymentStatus === 'Paid') {
                $invoice = generate_invoice_for_booking($pdo, $bookingId, [
                    'amount' => (float) $payhereAmount,
                    'currency' => $payhereCurrency,
                    'method' => $method ?: 'PayHere',
                    'paid_at' => date('Y-m-d H:i:s'),
                ]);

                $freshBooking = get_booking_by_id($pdo, $bookingId) ?: $freshBooking;
                send_payment_success_emails($pdo, $freshBooking, [
                    'amount' => (float) $payhereAmount,
                    'currency' => $payhereCurrency,
                    'method' => $method ?: 'PayHere',
                    'invoice' => $invoice,
                ]);
            } elseif (in_array($paymentStatus, ['Failed', 'Cancelled'], true)) {
                send_payment_failed_email($pdo, $freshBooking);
            }
        }
    } catch (Throwable $e) {
        error_log('PayHere notify side-effect error after DB update: ' . $e->getMessage());
    }
}

notify_text_response(200, 'OK');
