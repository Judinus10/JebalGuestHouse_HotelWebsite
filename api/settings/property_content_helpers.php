<?php
declare(strict_types=1);

function ensure_property_content_tables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS property_amenities (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        is_available TINYINT(1) NOT NULL DEFAULT 0,
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS nearby_places (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        distance DECIMAL(8,2) NOT NULL,
        distance_unit ENUM('m', 'km') NOT NULL DEFAULT 'km',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function get_property_content(PDO $pdo, bool $publicOnly = false): array
{
    ensure_property_content_tables($pdo);

    $amenitiesSql = 'SELECT id, name, is_available, is_visible FROM property_amenities';
    if ($publicOnly) {
        $amenitiesSql .= ' WHERE is_available = 0 AND is_visible = 1';
    }
    $amenitiesSql .= ' ORDER BY id ASC';

    $amenities = array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'is_available' => (bool) $row['is_available'],
            'is_visible' => (bool) $row['is_visible'],
        ];
    }, $pdo->query($amenitiesSql)->fetchAll());

    $nearbyPlaces = array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'name' => (string) $row['name'],
            'distance' => (float) $row['distance'],
            'distance_unit' => (string) $row['distance_unit'],
        ];
    }, $pdo->query('SELECT id, name, distance, distance_unit FROM nearby_places ORDER BY id ASC')->fetchAll());

    return [
        'amenities' => $amenities,
        'nearby_places' => $nearbyPlaces,
    ];
}

function save_property_content(PDO $pdo, array $payload): array
{
    ensure_property_content_tables($pdo);

    $hasAmenities = array_key_exists('amenities', $payload);
    $amenitiesInput = $payload['amenities'] ?? [];
    $nearbyInput = $payload['nearby_places'] ?? [];

    if (!is_array($amenitiesInput) || !is_array($nearbyInput)) {
        json_response(false, 'Amenities and nearby places must be valid lists.', 422);
    }

    if (count($amenitiesInput) > 100 || count($nearbyInput) > 100) {
        json_response(false, 'A maximum of 100 entries is allowed in each section.', 422);
    }

    $amenities = [];
    foreach ($amenitiesInput as $item) {
        if (!is_array($item)) continue;
        $name = clean_string($item['name'] ?? '', 120);
        if ($name === '') continue;

        $amenities[] = [
            'name' => $name,
            'is_available' => !empty($item['is_available']) ? 1 : 0,
            'is_visible' => !empty($item['is_visible']) ? 1 : 0,
        ];
    }

    $nearbyPlaces = [];
    foreach ($nearbyInput as $item) {
        if (!is_array($item)) continue;
        $name = clean_string($item['name'] ?? '', 120);
        $distance = filter_var($item['distance'] ?? null, FILTER_VALIDATE_FLOAT);
        $unit = ($item['distance_unit'] ?? 'km') === 'm' ? 'm' : 'km';

        if ($name === '' || $distance === false || $distance < 0) {
            json_response(false, 'Each nearby place needs a name and a valid non-negative distance.', 422);
        }

        $nearbyPlaces[] = [
            'name' => $name,
            'distance' => round((float) $distance, 2),
            'distance_unit' => $unit,
        ];
    }

    $pdo->beginTransaction();
    try {
        if ($hasAmenities) {
            $pdo->exec('DELETE FROM property_amenities');
            $amenityStmt = $pdo->prepare(
                'INSERT INTO property_amenities (name, is_available, is_visible) VALUES (:name, :is_available, :is_visible)'
            );
            foreach ($amenities as $item) {
                $amenityStmt->execute($item);
            }
        }

        $pdo->exec('DELETE FROM nearby_places');
        $nearbyStmt = $pdo->prepare(
            'INSERT INTO nearby_places (name, distance, distance_unit) VALUES (:name, :distance, :distance_unit)'
        );
        foreach ($nearbyPlaces as $item) {
            $nearbyStmt->execute($item);
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    return get_property_content($pdo);
}
