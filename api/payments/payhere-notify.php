<?php
/**
 * PayHere notify endpoint.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../invoices/invoice-helper.php';
require_once __DIR__ . '/../mail/email-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Only POST allowed');
}

$merchantId = clean_string($_POST['merchant_id'] ?? '');
$orderId = clean_string($_POST['order_id'] ?? '');
$paymentId = clean_string($_POST['payment_id'] ?? '');
$payhereAmount = clean_string($_POST['payhere_amount'] ?? '');
$payhereCurrency = clean_string($_POST['payhere_currency'] ?? '');
$statusCode = clean_string($_POST['status_code'] ?? '');
$md5sig = strtoupper(clean_string($_POST['md5sig'] ?? ''));
$method = clean_string($_POST['method'] ?? 'PayHere');
$statusMessage = clean_string($_POST['status_message'] ?? '');
$bookingId = (int) clean_string($_POST['custom_1'] ?? '0');

if ($merchantId === '' || $orderId === '' || $payhereAmount === '' || $payhereCurrency === '' || $statusCode === '' || $md5sig === '') {
    http_response_code(400);
    exit('Missing required fields');
}

$localHash = generate_payhere_notify_hash($merchantId, $orderId, $payhereAmount, $payhereCurrency, $statusCode, PAYHERE_MERCHANT_SECRET);

if (!hash_equals($localHash, $md5sig) || $merchantId !== PAYHERE_MERCHANT_ID) {
    http_response_code(403);
    exit('Invalid PayHere signature');
}

$statusMap = [
    '2' => 'Paid',
    '0' => 'Payment Pending',
    '-1' => 'Cancelled',
    '-2' => 'Failed',
    '-3' => 'Refunded',
];

$paymentStatus = $statusMap[$statusCode] ?? 'Failed';
$bookingStatus = $paymentStatus === 'Paid' ? 'Confirmed' : null;

try {
    $pdo = get_db_connection();
    $pdo->beginTransaction();

    if ($bookingId < 1) {
        $findPayment = $pdo->prepare('SELECT booking_id FROM payments WHERE order_id = :order_id LIMIT 1');
        $findPayment->execute([':order_id' => $orderId]);
        $found = $findPayment->fetch();
        $bookingId = $found ? (int) $found['booking_id'] : 0;
    }

    $paymentStmt = $pdo->prepare('SELECT id FROM payments WHERE order_id = :order_id LIMIT 1 FOR UPDATE');
    $paymentStmt->execute([':order_id' => $orderId]);
    $existingPayment = $paymentStmt->fetch();

    if ($existingPayment) {
        $updatePayment = $pdo->prepare(
            'UPDATE payments
             SET payment_id = :payment_id,
                 amount = :amount,
                 currency = :currency,
                 status = :status,
                 method = :method,
                 gateway_response = :gateway_response,
                 updated_at = NOW()
             WHERE order_id = :order_id'
        );
        $updatePayment->execute([
            ':payment_id' => $paymentId,
            ':amount' => (float) $payhereAmount,
            ':currency' => $payhereCurrency,
            ':status' => $paymentStatus,
            ':method' => $method,
            ':gateway_response' => json_encode($_POST, JSON_UNESCAPED_SLASHES),
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
            ':payment_id' => $paymentId,
            ':amount' => (float) $payhereAmount,
            ':currency' => $payhereCurrency,
            ':status' => $paymentStatus,
            ':method' => $method,
            ':gateway_response' => json_encode($_POST, JSON_UNESCAPED_SLASHES),
        ]);
    }

    if ($bookingId > 0) {
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

        $updateBookingSql = 'UPDATE bookings SET payment_status = :payment_status';
        $updateBookingParams = [':payment_status' => $paymentStatus, ':id' => $bookingId];

        if ($bookingStatus !== null) {
            $updateBookingSql .= ', status = :status';
            $updateBookingParams[':status'] = $bookingStatus;
        }

        $updateBookingSql .= ', updated_at = NOW() WHERE id = :id';
        $updateBooking = $pdo->prepare($updateBookingSql);
        $updateBooking->execute($updateBookingParams);
    }

    $pdo->commit();

    if ($bookingId > 0) {
        $booking = get_booking_by_id($pdo, $bookingId);

        if ($booking) {
            if ($paymentStatus === 'Paid') {
                $invoice = generate_invoice_for_booking($pdo, $bookingId, [
                    'amount' => (float) $payhereAmount,
                    'currency' => $payhereCurrency,
                    'method' => $method,
                    'paid_at' => date('Y-m-d H:i:s'),
                ]);

                $booking = get_booking_by_id($pdo, $bookingId) ?: $booking;
                send_payment_success_emails($pdo, $booking, [
                    'amount' => (float) $payhereAmount,
                    'currency' => $payhereCurrency,
                    'method' => $method,
                    'invoice' => $invoice,
                ]);
            } elseif ($paymentStatus === 'Failed') {
                send_payment_failed_email($pdo, $booking);
            }
        }
    }

    http_response_code(200);
    exit('OK');
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('PayHere notify error: ' . $e->getMessage());
    http_response_code(500);
    exit('Server error');
}
