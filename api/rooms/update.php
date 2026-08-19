<?php
declare(strict_types=1);
require_once __DIR__ . '/_room_helpers.php';
apply_cors_headers();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(false, 'Only POST requests are allowed.', 405);
require_admin_auth();

$pdo = null;
$committed = false;

try {
    $pdo = get_db_connection();
    ensure_room_images_table($pdo);
    ensure_amenity_tables($pdo);
    $data = room_input_data();
    $id = (int) ($data['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) json_response(false, 'Room id is required.', 422, ['error_code' => 'INVALID_ROOM_ID']);

    $exists = $pdo->prepare('SELECT id FROM rooms WHERE id = :id LIMIT 1');
    $exists->execute([':id' => $id]);
    if (!$exists->fetchColumn()) json_response(false, 'The selected room no longer exists.', 404, ['error_code' => 'ROOM_NOT_FOUND']);

    $roomName = clean_string($data['room_name'] ?? '', 150);
    if ($roomName === '') json_response(false, 'Room name is required.', 422, ['error_code' => 'ROOM_NAME_REQUIRED']);

    $values = [
        'slug' => slugify_room($data['slug'] ?? $roomName),
        'description' => clean_string($data['description'] ?? '', 5000),
        'max_guests' => max(1, (int) ($data['max_guests'] ?? $data['capacity'] ?? 2)),
        'bed_type' => clean_string($data['bed_type'] ?? '', 100),
        'base_price' => max(0, (float) ($data['base_price'] ?? $data['price_per_night'] ?? 0)),
        'currency' => clean_string($data['currency'] ?? 'USD', 10),
        'status' => in_array($data['status'] ?? 'Available', ['Available', 'Unavailable', 'Maintenance'], true) ? (string) $data['status'] : 'Available',
        'sort_order' => max(0, (int) ($data['sort_order'] ?? 0)),
        'show_unavailable_amenities' => !empty($data['show_unavailable_amenities']) ? 1 : 0,
    ];
    $amenityIds = parse_amenity_ids($data['amenity_ids'] ?? []);
    $amenities = amenity_names_for_ids($pdo, $amenityIds);

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("UPDATE rooms SET room_name=:room_name,slug=:slug,description=:description,max_guests=:max_guests,bed_type=:bed_type,base_price=:base_price,currency=:currency,amenities=:amenities,show_unavailable_amenities=:show_unavailable_amenities,status=:status,sort_order=:sort_order WHERE id=:id");
    $stmt->execute([
        ':id' => $id, ':room_name' => $roomName, ':slug' => $values['slug'],
        ':description' => $values['description'], ':max_guests' => $values['max_guests'],
        ':bed_type' => $values['bed_type'], ':base_price' => $values['base_price'],
        ':currency' => $values['currency'],
        ':amenities' => json_encode($amenities, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':show_unavailable_amenities' => $values['show_unavailable_amenities'],
        ':status' => $values['status'], ':sort_order' => $values['sort_order'],
    ]);
    replace_room_amenities($pdo, $id, $amenityIds);
    if (!$pdo->inTransaction()) {
        // This should never happen now that schema checks run before the
        // transaction, but do not report a false failure if hosting-specific
        // MySQL behaviour has already committed the write.
        $committed = true;
        error_log('Room '.$id.' transaction was committed implicitly before the explicit commit.');
    } else {
        $pdo->commit();
        $committed = true;
    }

    $warning = '';
    try {
        save_room_images($pdo, $id, $_FILES['images'] ?? []);
    } catch (Throwable $imageError) {
        error_log('Room '.$id.' updated but image processing failed: '.$imageError->getMessage());
        $warning = 'The room details were saved, but new images could not be processed. Review the room images and upload them again.';
    }

    try {
        $images = fetch_room_images($pdo, [$id]);
        $roomStmt = $pdo->prepare('SELECT * FROM rooms WHERE id = :id LIMIT 1');
        $roomStmt->execute([':id' => $id]);
        $room = $roomStmt->fetch();
        if (!is_array($room)) throw new RuntimeException('Updated room reload failed.');
        $assignments = fetch_room_amenity_assignments($pdo, [$id]);
        $normalized = normalize_room($room, $images[$id] ?? [], $assignments[$id] ?? [], list_amenities($pdo));
        json_response(true, $warning ?: 'Room updated successfully.', 200, [
            'data' => $normalized, 'room' => $normalized,
            'warning' => $warning ?: null,
            'warning_code' => $warning ? 'ROOM_IMAGES_NOT_SAVED' : null,
        ]);
    } catch (Throwable $reloadError) {
        error_log('Room '.$id.' updated but response reload failed: '.$reloadError->getMessage());
        $fallback = array_merge($values, [
            'id' => $id, 'room_name' => $roomName, 'name' => $roomName,
            'capacity' => $values['max_guests'], 'price_per_night' => $values['base_price'],
            'amenities' => $amenities, 'amenity_ids' => $amenityIds,
            'show_unavailable_amenities' => (bool) $values['show_unavailable_amenities'],
        ]);
        json_response(true, 'Room updated successfully.', 200, [
            'data' => $fallback, 'room' => $fallback,
            'warning' => 'The room was saved, but its latest details could not be reloaded automatically. Refresh the room list.',
            'warning_code' => 'ROOM_RELOAD_REQUIRED',
        ]);
    }
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Room update error: '.$e->getMessage());
    if ($committed) {
        json_response(true, 'Room updated successfully.', 200, [
            'warning' => 'The room was saved, but the final response could not be completed. Refresh the room list.',
            'warning_code' => 'ROOM_RELOAD_REQUIRED',
        ]);
    }
    json_response(false, 'The room could not be updated. Check the details and try again.', 500, ['error_code' => 'ROOM_UPDATE_FAILED']);
}
