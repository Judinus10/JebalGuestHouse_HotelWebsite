<?php
/**
 * Deletes a contact enquiry from the admin dashboard.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_response(false, 'Only POST requests are allowed.', 405);
}

$input = read_request_data();
$id = (int) ($input['id'] ?? 0);

if ($id < 1) {
    api_json_response(false, 'Valid enquiry ID is required.', 422);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->prepare('DELETE FROM enquiries WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        api_json_response(false, 'Enquiry not found.', 404);
    }

    api_json_response(true, 'Enquiry deleted successfully.', 200, [
        'data' => ['id' => $id],
    ]);
} catch (Throwable $e) {
    error_log('Contact delete error: ' . $e->getMessage());
    api_json_response(false, 'Could not delete enquiry.', 500);
}
