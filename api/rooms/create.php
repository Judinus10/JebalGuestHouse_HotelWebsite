<?php
declare(strict_types=1);
require_once __DIR__ . '/_room_helpers.php';
apply_cors_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(false, 'Only POST requests are allowed.', 405);
require_admin_auth();
try {
    $pdo = get_db_connection();
    ensure_room_images_table($pdo);
    ensure_amenity_tables($pdo);
    $data = room_input_data();
    $roomName = clean_string($data['room_name'] ?? '', 150);
    if ($roomName === '') json_response(false, 'Room name is required.', 422);
    $slug = slugify_room($data['slug'] ?? $roomName);
    $amenityIds = parse_amenity_ids($data['amenity_ids'] ?? []);
    $amenities = amenity_names_for_ids($pdo, $amenityIds);
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO rooms (room_name, slug, description, max_guests, bed_type, base_price, currency, amenities, show_unavailable_amenities, status, sort_order) VALUES (:room_name, :slug, :description, :max_guests, :bed_type, :base_price, :currency, :amenities, :show_unavailable_amenities, :status, :sort_order)");
    $stmt->execute([
        ':room_name' => $roomName,
        ':slug' => $slug,
        ':description' => clean_string($data['description'] ?? '', 5000),
        ':max_guests' => max(1, (int) ($data['max_guests'] ?? $data['capacity'] ?? 2)),
        ':bed_type' => clean_string($data['bed_type'] ?? '', 100),
        ':base_price' => max(0, (float) ($data['base_price'] ?? $data['price_per_night'] ?? 0)),
        ':currency' => clean_string($data['currency'] ?? 'USD', 10),
        ':amenities' => json_encode($amenities, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':show_unavailable_amenities' => !empty($data['show_unavailable_amenities']) ? 1 : 0,
        ':status' => in_array($data['status'] ?? 'Available', ['Available', 'Unavailable', 'Maintenance'], true) ? $data['status'] : 'Available',
        ':sort_order' => max(0, (int) ($data['sort_order'] ?? 0)),
    ]);
    $roomId = (int) $pdo->lastInsertId();
    replace_room_amenities($pdo, $roomId, $amenityIds);
    $pdo->commit();
    save_room_images($pdo, $roomId, $_FILES['images'] ?? []);
    $rooms = get_room_payload($pdo, false);
    $room = array_values(array_filter($rooms, static fn($item) => (int) $item['id'] === $roomId))[0] ?? null;
    json_response(true, 'Room created.', 201, ['data' => $room, 'room' => $room]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    json_response(false, 'Unable to create room.', 500, ['error' => APP_ENV === 'local' ? $e->getMessage() : null]);
}
