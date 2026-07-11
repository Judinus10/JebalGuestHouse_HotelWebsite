<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../mail/email-helper.php';

apply_cors_headers();
require_admin_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();
$id = (int) ($data['id'] ?? 0);
$status = strtolower(clean_string($data['status'] ?? '', 30));
$status = str_replace([' ', '-'], '_', $status);
$allowedStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'canceled', 'no_show'];

if ($status === 'canceled') {
    $status = 'cancelled';
}

if ($id < 1 || !in_array($status, $allowedStatuses, true)) {
    json_response(false, 'Valid booking ID and status are required.', 422);
}

try {
    $pdo = get_db_connection();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE');
    $stmt->execute([':id' => $id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        json_response(false, 'Booking was not found.', 404);
    }

    $oldStatus = strtolower(trim((string) ($booking['status'] ?? '')));
    $oldStatus = str_replace([' ', '-'], '_', $oldStatus);

    $paymentStatusKey = strtolower(trim((string) ($booking['payment_status'] ?? '')));
    $paymentStatusKey = preg_replace('/^payment\s+/', '', $paymentStatusKey) ?? $paymentStatusKey;
    $paymentStatusKey = str_replace([' ', '-'], '_', $paymentStatusKey);
    $canProcessBooking = in_array($paymentStatusKey, ['paid', 'no_pay', 'nopay'], true);

    if (in_array($status, ['checked_in', 'checked_out'], true) && !$canProcessBooking) {
        $pdo->rollBack();
        json_response(false, 'Check-in and check-out are available only when payment status is Paid or No Pay.', 403);
    }

    if ($status === 'confirmed') {
        $conflict = $pdo->prepare(
            "SELECT id
             FROM bookings
             WHERE id <> :id
               AND room_name = :room_name
               AND status IN ('Confirmed', 'Checked In')
               AND :requested_check_in < check_out_date
               AND :requested_check_out > check_in_date
             LIMIT 1"
        );
        $conflict->execute([
            ':id' => $id,
            ':room_name' => $booking['room_name'],
            ':requested_check_in' => $booking['check_in_date'],
            ':requested_check_out' => $booking['check_out_date'],
        ]);

        if ($conflict->fetch()) {
            $pdo->rollBack();
            json_response(false, 'Cannot confirm this booking because the room is already occupied for overlapping dates.', 409);
        }
    }

    $displayStatusMap = [
        'pending' => 'Pending',
        'confirmed' => 'Confirmed',
        'checked_in' => 'Checked In',
        'checked_out' => 'Checked Out',
        'cancelled' => 'Cancelled',
        'no_show' => 'No Show',
    ];
    $displayStatus = $displayStatusMap[$status] ?? ucfirst($status);

    $paymentStatus = (string) ($booking['payment_status'] ?? '');
    $bookingAlreadyUpdated = $oldStatus === $status;
    $paymentAlreadyCancelled = strtolower(trim($paymentStatus)) === 'cancelled';

    if (!$bookingAlreadyUpdated || ($status === 'cancelled' && !$paymentAlreadyCancelled)) {
        if ($status === 'cancelled') {
            $update = $pdo->prepare(
                "UPDATE bookings
                 SET status = 'Cancelled', payment_status = 'Cancelled', updated_at = NOW()
                 WHERE id = :id"
            );
            $update->execute([':id' => $id]);

            $paymentUpdate = $pdo->prepare(
                "UPDATE payments
                 SET status = 'Cancelled', updated_at = NOW()
                 WHERE booking_id = :booking_id"
            );
            $paymentUpdate->execute([':booking_id' => $id]);

            $paymentStatus = 'Cancelled';
        } elseif ($status === 'confirmed') {
            $update = $pdo->prepare(
                "UPDATE bookings
                 SET status = 'Confirmed', payment_status = 'Paid', updated_at = NOW()
                 WHERE id = :id"
            );
            $update->execute([':id' => $id]);

            $paymentUpdate = $pdo->prepare(
                "UPDATE payments
                 SET status = 'Paid', updated_at = NOW()
                 WHERE booking_id = :booking_id"
            );
            $paymentUpdate->execute([':booking_id' => $id]);

            $paymentStatus = 'Paid';
        } else {
            $update = $pdo->prepare('UPDATE bookings SET status = :status, updated_at = NOW() WHERE id = :id');
            $update->execute([
                ':status' => $displayStatus,
                ':id' => $id,
            ]);
        }
    }

    $pdo->commit();

    $booking['status'] = $displayStatus;
    $booking['payment_status'] = $paymentStatus;

    if (!$bookingAlreadyUpdated) {
        try {
            if ($status === 'confirmed') {
                send_booking_confirmed_email($pdo, $booking);
            }

            if ($status === 'cancelled') {
                send_booking_cancelled_emails($pdo, $booking);
            }
        } catch (Throwable $emailError) {
            error_log('Booking status email error: ' . $emailError->getMessage());
        }
    }

    json_response(true, $bookingAlreadyUpdated ? 'Booking status is already updated.' : 'Booking status updated successfully.', 200, [
        'data' => [
            'id' => $id,
            'booking_status' => $status,
            'payment_status' => $paymentStatus,
        ],
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Admin update booking status error: ' . $e->getMessage());
    json_response(false, 'Unable to update booking status.', 500);
}
