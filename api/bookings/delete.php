<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

apply_cors_headers();
require_admin_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();
$id = (int) ($data['id'] ?? 0);

if ($id < 1) {
    json_response(false, 'Valid booking ID is required.', 422);
}

try {
    $pdo = get_db_connection();
    $groupStmt = $pdo->prepare('SELECT booking_group_id FROM bookings WHERE id = :id LIMIT 1');
    $groupStmt->execute([':id' => $id]);
    $groupId = (int) ($groupStmt->fetchColumn() ?: 0);

    $pdo->beginTransaction();
    if ($groupId > 0) {
        $paymentDelete = $pdo->prepare('DELETE p FROM payments p INNER JOIN bookings b ON b.id = p.booking_id WHERE b.booking_group_id = :group_id');
        $paymentDelete->execute([':group_id' => $groupId]);
        $stmt = $pdo->prepare('DELETE FROM bookings WHERE booking_group_id = :group_id');
        $stmt->execute([':group_id' => $groupId]);
        $pdo->prepare('DELETE FROM booking_groups WHERE id = :group_id')->execute([':group_id' => $groupId]);
    } else {
        $stmt = $pdo->prepare('DELETE FROM bookings WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        json_response(false, 'Booking not found.', 404);
    }

    $pdo->commit();

    json_response(true, 'Booking deleted successfully.', 200, [
        'data' => ['id' => $id],
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Admin booking delete error: ' . $e->getMessage());
    json_response(false, 'Unable to delete booking.', 500);
}
