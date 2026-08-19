<?php
declare(strict_types=1);

require_once __DIR__ . '/_experience_helpers.php';

try {
    $pdo = experience_db();

    $stmt = $pdo->query("
        SELECT *
        FROM experience_items
        WHERE status = 'active'
        ORDER BY sort_order ASC, id DESC
    ");

    $items = array_map('experience_normalize', $stmt->fetchAll(PDO::FETCH_ASSOC));

    experience_json([
        'success' => true,
        'data' => $items,
    ]);
} catch (Throwable $e) {
    error_log('Public experience load error: ' . $e->getMessage());
    experience_json([
        'success' => false,
        'message' => 'Experience information is temporarily unavailable. Please try again later.',
        'error_code' => 'EXPERIENCES_UNAVAILABLE',
    ], 500);
}
