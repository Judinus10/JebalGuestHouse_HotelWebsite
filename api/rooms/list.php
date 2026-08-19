<?php
declare(strict_types=1);
require_once __DIR__ . '/_room_helpers.php';
apply_cors_headers();
require_admin_auth();
try {
    $rooms = get_room_payload(get_db_connection(), false);
    json_response(true, 'Rooms loaded.', 200, ['data' => $rooms, 'rooms' => $rooms]);
} catch (Throwable $e) {
    error_log('Admin rooms list error: ' . $e->getMessage());
    json_response(false, 'Rooms could not be loaded. Please refresh the page.', 500, ['error_code' => 'ROOMS_LOAD_FAILED']);
}
