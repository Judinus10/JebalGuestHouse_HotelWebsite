<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

function gallery_slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    return trim($value, '-');
}

function gallery_upload_public_base(): string
{
    $base = defined('API_BASE_URL') && API_BASE_URL !== ''
        ? rtrim(API_BASE_URL, '/')
        : 'http://localhost/HotelWebsite/api';

    return $base . '/uploads/gallery';
}

function gallery_upload_dir(): string
{
    $dir = __DIR__ . '/../uploads/gallery';

    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    return $dir;
}

function gallery_image_url(string $path): string
{
    $path = trim($path);
    if ($path === '') return '';
    if (preg_match('/^https?:\/\//i', $path)) return $path;
    return gallery_upload_public_base() . '/' . ltrim($path, '/');
}

function gallery_normalize_folder(array $row): array
{
    return [
        'id' => (int) ($row['id'] ?? 0),
        'name' => (string) ($row['name'] ?? ''),
        'slug' => (string) ($row['slug'] ?? ''),
        'status' => (string) ($row['status'] ?? 'active'),
        'sort_order' => (int) ($row['sort_order'] ?? 1),
        'created_at' => (string) ($row['created_at'] ?? ''),
        'updated_at' => (string) ($row['updated_at'] ?? ''),
        'image_count' => (int) ($row['image_count'] ?? 0),
        'active_count' => (int) ($row['active_count'] ?? 0),
        'inactive_count' => (int) ($row['inactive_count'] ?? 0),
        'cover_image' => gallery_image_url((string) ($row['cover_image'] ?? '')),
    ];
}

function gallery_normalize_image(array $row): array
{
    return [
        'id' => (int) ($row['id'] ?? 0),
        'folder_id' => (int) ($row['folder_id'] ?? 0),
        'folder_name' => (string) ($row['folder_name'] ?? ''),
        'folder_slug' => (string) ($row['folder_slug'] ?? ''),
        'title' => (string) ($row['title'] ?? ''),
        'image_path' => gallery_image_url((string) ($row['image_path'] ?? '')),
        'stored_path' => (string) ($row['image_path'] ?? ''),
        'image_file_name' => (string) ($row['image_file_name'] ?? ''),
        'status' => (string) ($row['status'] ?? 'active'),
        'sort_order' => (int) ($row['sort_order'] ?? 1),
        'created_at' => (string) ($row['created_at'] ?? ''),
        'updated_at' => (string) ($row['updated_at'] ?? ''),
    ];
}

function gallery_reindex_folder(PDO $pdo, int $folderId): void
{
    $stmt = $pdo->prepare('SELECT id FROM gallery_images WHERE folder_id = :folder_id ORDER BY sort_order ASC, id ASC');
    $stmt->execute([':folder_id' => $folderId]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $update = $pdo->prepare('UPDATE gallery_images SET sort_order = :sort_order WHERE id = :id');
    foreach ($ids as $index => $id) {
        $update->execute([':sort_order' => $index + 1, ':id' => (int) $id]);
    }
}

function gallery_move_sort_space(PDO $pdo, int $folderId, int $sortOrder): void
{
    $stmt = $pdo->prepare('UPDATE gallery_images SET sort_order = sort_order + 1 WHERE folder_id = :folder_id AND sort_order >= :sort_order');
    $stmt->execute([':folder_id' => $folderId, ':sort_order' => $sortOrder]);
}

function gallery_delete_file_if_local(string $storedPath): void
{
    $storedPath = trim($storedPath);
    if ($storedPath === '' || preg_match('/^https?:\/\//i', $storedPath)) return;

    $dir = realpath(gallery_upload_dir());
    $file = realpath(gallery_upload_dir() . '/' . basename($storedPath));

    if ($file && $dir && str_starts_with($file, $dir) && is_file($file)) {
        @unlink($file);
    }
}
