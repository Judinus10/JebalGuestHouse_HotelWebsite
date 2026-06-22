<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

function experience_json(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function experience_db(): PDO
{
    if (!function_exists('get_db_connection')) {
        experience_json([
            'success' => false,
            'message' => 'get_db_connection() not found in api/helpers.php',
        ], 500);
    }

    return get_db_connection();
}

function experience_upload_dir(): string
{
    $dir = __DIR__ . '/../uploads/experience';

    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    return $dir;
}

function experience_public_base(): string
{
    return 'http://localhost/HotelWebsite/api/uploads/experience';
}

function experience_image_url(?string $path): string
{
    if (!$path) return '';

    if (preg_match('/^https?:\/\//i', $path)) {
        return $path;
    }

    return experience_public_base() . '/' . ltrim($path, '/');
}

function experience_normalize(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'title' => (string) $row['title'],
        'category' => (string) $row['category'],
        'location' => (string) ($row['location'] ?? ''),
        'description' => (string) $row['description'],
        'image_path' => experience_image_url($row['image_path'] ?? ''),
        'stored_path' => (string) ($row['image_path'] ?? ''),
        'status' => (string) $row['status'],
        'sort_order' => (int) $row['sort_order'],
        'created_at' => (string) $row['created_at'],
        'updated_at' => (string) $row['updated_at'],
    ];
}

function experience_upload_image(string $field = 'image'): ?string
{
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        experience_json([
            'success' => false,
            'message' => 'Image upload failed.',
        ], 400);
    }

    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = mime_content_type($_FILES[$field]['tmp_name']);

    if (!isset($allowed[$mime])) {
        experience_json([
            'success' => false,
            'message' => 'Only JPG, PNG, and WEBP images are allowed.',
        ], 400);
    }

    $filename = 'experience_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $allowed[$mime];
    $target = experience_upload_dir() . '/' . $filename;

    if (!move_uploaded_file($_FILES[$field]['tmp_name'], $target)) {
        experience_json([
            'success' => false,
            'message' => 'Failed to save uploaded image.',
        ], 500);
    }

    return $filename;
}

function experience_delete_file(?string $path): void
{
    if (!$path || preg_match('/^https?:\/\//i', $path)) return;

    $file = experience_upload_dir() . '/' . basename($path);

    if (is_file($file)) {
        @unlink($file);
    }
}