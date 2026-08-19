<?php
declare(strict_types=1);
require_once __DIR__ . '/_room_helpers.php';
apply_cors_headers();
try {
    $pdo = get_db_connection();
    ensure_room_images_table($pdo);
    $id = clean_string($_GET['id'] ?? $_GET['slug'] ?? '', 180);
    if ($id === '') json_response(false, 'Room id is required.', 422);
    if (ctype_digit($id)) {
        $stmt = $pdo->prepare('SELECT * FROM rooms WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => (int) $id]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM rooms WHERE slug = :slug LIMIT 1');
        $stmt->execute([':slug' => $id]);
    }
    $room = $stmt->fetch();
    if (!$room) json_response(false, 'Room not found.', 404);
    $images = fetch_room_images($pdo, [(int) $room['id']]);
    $roomId = (int) $room['id'];
    $assignments = fetch_room_amenity_assignments($pdo, [$roomId]);
    $payload = normalize_room($room, $images[$roomId] ?? [], $assignments[$roomId] ?? [], list_amenities($pdo));
    json_response(true, 'Room loaded.', 200, ['data' => $payload, 'room' => $payload]);
} catch (Throwable $e) {
    error_log('Room detail load error: ' . $e->getMessage());
    json_response(false, 'The room could not be loaded. Please try again.', 500, ['error_code' => 'ROOM_LOAD_FAILED']);
}
