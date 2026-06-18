<?php
/**
 * Returns contact enquiries for the admin dashboard messages page.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    api_json_response(false, 'Only GET requests are allowed.', 405);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->query(
        "SELECT
            id,
            CONCAT('INQ-', LPAD(id, 5, '0')) AS inquiry_id,
            name,
            email,
            phone,
            subject,
            message,
            status,
            created_at,
            updated_at
         FROM enquiries
         ORDER BY created_at DESC"
    );

    api_json_response(true, 'Enquiries loaded successfully.', 200, [
        'data' => $stmt->fetchAll(),
    ]);
} catch (Throwable $e) {
    error_log('Contact enquiries list error: ' . $e->getMessage());
    api_json_response(false, 'Could not load enquiries.', 500);
}
