<?php
declare(strict_types=1);

require_once __DIR__ . '/_experience_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(false, 'Only GET requests are allowed.', 405);
}
require_admin_auth();

try {
    $pdo = experience_db();

    $stmt = $pdo->query("
        SELECT *
        FROM experience_items
        ORDER BY sort_order ASC, id DESC
    ");

    $items = array_map('experience_normalize', $stmt->fetchAll(PDO::FETCH_ASSOC));

    experience_json([
        'success' => true,
        'data' => $items,
    ]);
} catch (Throwable $e) {
    error_log('Experience list error: ' . $e->getMessage());
    experience_json([
        'success' => false,
        'message' => 'Unable to load experience items.',
    ], 500);
}
