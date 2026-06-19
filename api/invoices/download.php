<?php
/**
 * Invoice download endpoint.
 * Usage: /api/invoices/download.php?id=BOOKING_ID
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

$bookingId = (int) ($_GET['id'] ?? 0);

if ($bookingId < 1) {
    http_response_code(422);
    exit('Valid booking ID is required.');
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT invoice_file_path, invoice_number FROM bookings WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $bookingId]);
    $booking = $stmt->fetch();

    if (!$booking || empty($booking['invoice_file_path'])) {
        http_response_code(404);
        exit('Invoice not found.');
    }

    $filePath = realpath(__DIR__ . '/../' . $booking['invoice_file_path']);
    $basePath = realpath(__DIR__ . '/../storage/invoices');

    if (!$filePath || !$basePath || !str_starts_with($filePath, $basePath) || !is_file($filePath)) {
        http_response_code(404);
        exit('Invoice file not found.');
    }

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . basename($booking['invoice_number'] ?: 'invoice') . '.pdf"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
} catch (Throwable $e) {
    error_log('Invoice download error: ' . $e->getMessage());
    http_response_code(500);
    exit('Unable to download invoice.');
}
