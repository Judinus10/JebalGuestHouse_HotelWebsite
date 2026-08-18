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
    $id = (int) ($data['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) json_response(false, 'Room id is required.', 422);
    $roomName = clean_string($data['room_name'] ?? '', 150);
    if ($roomName === '') json_response(false, 'Room name is required.', 422);
    $amenityIds = parse_amenity_ids($data['amenity_ids'] ?? []);
    $amenities = amenity_names_for_ids($pdo, $amenityIds);
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("UPDATE rooms SET room_name = :room_name, slug = :slug, description = :description, max_guests = :max_guests, bed_type = :bed_type, base_price = :base_price, currency = :currency, amenities = :amenities, show_unavailable_amenities = :show_unavailable_amenities, status = :status, sort_order = :sort_order WHERE id = :id");
    $stmt->execute([
        ':id' => $id,
        ':room_name' => $roomName,
        ':slug' => slugify_room($data['slug'] ?? $roomName),
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
    replace_room_amenities($pdo, $id, $amenityIds);
    $pdo->commit();
    save_room_images($pdo, $id, $_FILES['images'] ?? []);
    $images = fetch_room_images($pdo, [$id]);
    $stmt = $pdo->prepare('SELECT * FROM rooms WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $room = $stmt->fetch();
    $assignments = fetch_room_amenity_assignments($pdo, [$id]);
    $catalog = list_amenities($pdo);
    $normalized = normalize_room($room, $images[$id] ?? [], $assignments[$id] ?? [], $catalog);
    json_response(true, 'Room updated.', 200, ['data' => $normalized, 'room' => $normalized]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    json_response(false, 'Unable to update room.', 500, ['error' => APP_ENV === 'local' ? $e->getMessage() : null]);
}
