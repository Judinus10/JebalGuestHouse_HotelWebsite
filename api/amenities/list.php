<?php
declare(strict_types=1);
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/_amenity_helpers.php';
apply_cors_headers();
require_admin_auth();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(false, 'Only GET requests are allowed.', 405);
try {
    json_response(true, 'Amenities loaded.', 200, ['data' => list_amenities(get_db_connection())]);
} catch (Throwable $e) {
    json_response(false, 'Unable to load amenities.', 500, ['error' => APP_ENV === 'local' ? $e->getMessage() : null]);
}
