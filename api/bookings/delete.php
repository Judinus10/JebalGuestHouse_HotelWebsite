<?php
/**
 * Deletes a booking inquiry from the admin bookings page.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();
$id = (int) ($data['id'] ?? 0);

if ($id < 1) {
    api_json_response(false, 'Booking inquiry ID is required.', 422);
}

try {
    $pdo = get_db_connection();

    $statement = $pdo->prepare('DELETE FROM booking_inquiries WHERE id = :id');
    $statement->execute([':id' => $id]);

    if ($statement->rowCount() === 0) {
        api_json_response(false, 'Booking inquiry not found.', 404);
    }

    api_json_response(true, 'Booking inquiry deleted successfully.', 200, [
        'data' => ['id' => $id],
    ]);
} catch (Throwable $e) {
    error_log('Admin booking delete error: ' . $e->getMessage());
    api_json_response(false, 'Unable to delete booking inquiry.', 500);
}
