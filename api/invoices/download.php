<?php
/**
 * Admin-only invoice download endpoint.
 * Usage: /api/invoices/download.php?id=BOOKING_ID
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

apply_cors_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    json_response(false, 'Only GET requests are allowed.', 405);
}

require_admin_auth();

$bookingId = (int) ($_GET['id'] ?? 0);

if ($bookingId < 1) {
    header('Content-Type: application/json; charset=utf-8');
    json_response(false, 'Valid booking ID is required.', 422);
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare('SELECT invoice_file_path, invoice_number FROM bookings WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $bookingId]);
    $booking = $stmt->fetch();

    if (!$booking || empty($booking['invoice_file_path'])) {
        header('Content-Type: application/json; charset=utf-8');
        json_response(false, 'Invoice not found.', 404);
    }

    $filePath = realpath(__DIR__ . '/../' . $booking['invoice_file_path']);
    $basePath = realpath(__DIR__ . '/../storage/invoices');

    if (!$filePath || !$basePath || !str_starts_with($filePath, $basePath) || !is_file($filePath)) {
        header('Content-Type: application/json; charset=utf-8');
        json_response(false, 'Invoice file not found.', 404);
    }

    $invoiceNumber = preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($booking['invoice_number'] ?: 'invoice')) ?: 'invoice';

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $invoiceNumber . '.pdf"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
} catch (Throwable $e) {
    error_log('Invoice download error: ' . $e->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    json_response(false, 'Unable to download invoice.', 500);
}
