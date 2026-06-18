<?php
/**
 * Updates contact enquiry status from the admin dashboard.
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
$status = clean_string($input['status'] ?? '');
$allowedStatuses = ['New', 'Read', 'Replied'];

if ($id < 1) {
    api_json_response(false, 'Valid enquiry ID is required.', 422);
}

if (!in_array($status, $allowedStatuses, true)) {
    api_json_response(false, 'Invalid enquiry status.', 422);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->prepare(
        'UPDATE enquiries
         SET status = :status, updated_at = NOW()
         WHERE id = :id'
    );

    $stmt->execute([
        ':status' => $status,
        ':id' => $id,
    ]);

    if ($stmt->rowCount() === 0) {
        api_json_response(false, 'Enquiry not found or status unchanged.', 404);
    }

    api_json_response(true, 'Enquiry status updated successfully.', 200, [
        'data' => [
            'id' => $id,
            'status' => $status,
        ],
    ]);
} catch (Throwable $e) {
    error_log('Contact status update error: ' . $e->getMessage());
    api_json_response(false, 'Could not update enquiry status.', 500);
}
