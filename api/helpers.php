<?php
/**
 * Jebal Homes API shared helpers.
 *
 * Centralized CORS, JSON responses, input reading, validation, email helpers,
 * and small utility functions used by the backend API.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

function apply_cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');
}

function handle_preflight_request(): void
{
    apply_cors_headers();

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function api_json_response(bool $success, string $message, int $statusCode = 200, array $extra = []): void
{
    apply_cors_headers();
    http_response_code($statusCode);

    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message,
    ], $extra), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    exit;
}

function read_request_data(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);

    if (is_array($data)) {
        return $data;
    }

    return $_POST ?: [];
}

function clean_string(mixed $value): string
{
    return trim((string) $value);
}

function is_valid_date(string $date): bool
{
    $parsed = DateTime::createFromFormat('Y-m-d', $date);
    return $parsed instanceof DateTime && $parsed->format('Y-m-d') === $date;
}

function html_safe(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function send_plain_email(string $to, string $subject, string $message, ?string $replyTo = null): bool
{
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';

    if ($replyTo !== null && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    return mail($to, $subject, $message, implode("\r\n", $headers));
}

function send_html_email(string $to, string $subject, string $htmlBody, ?string $replyTo = null): bool
{
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';

    if ($replyTo !== null && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}

function calculate_nights(string $checkInDate, string $checkOutDate): int
{
    $checkIn = new DateTime($checkInDate);
    $checkOut = new DateTime($checkOutDate);
    $nights = (int) $checkIn->diff($checkOut)->days;
    return max(1, $nights);
}

function get_room_rate(string $roomName): float
{
    return (float) (ROOM_RATES[$roomName] ?? 0);
}

function calculate_booking_amount(string $roomName, string $checkInDate, string $checkOutDate): float
{
    $rate = get_room_rate($roomName);

    if ($rate <= 0) {
        return 0;
    }

    return $rate * calculate_nights($checkInDate, $checkOutDate);
}

function normalize_booking_status(string $status): string
{
    $status = strtolower(trim($status));

    return match ($status) {
        'confirmed' => 'Confirmed',
        'cancelled', 'canceled' => 'Cancelled',
        default => 'Pending',
    };
}

function normalize_payment_status(string $status): string
{
    $status = strtolower(trim($status));

    return match ($status) {
        'paid' => 'paid',
        'failed' => 'failed',
        'refunded' => 'refunded',
        'cancelled', 'canceled' => 'cancelled',
        'unpaid' => 'unpaid',
        default => 'pending',
    };
}
