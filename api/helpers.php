<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function apply_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }
}

function apply_cors_headers(): void
{
    apply_security_headers();

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin !== '' && in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response(bool $success, string $message, int $statusCode = 200, array $extra = []): void
{
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

function clean_string(mixed $value, int $maxLength = 1000): string
{
    $value = trim((string) $value);
    $value = preg_replace('/[ -]/u', '', $value) ?? '';
    return mb_substr($value, 0, $maxLength);
}

function is_valid_date(string $date): bool
{
    $parsed = DateTime::createFromFormat('Y-m-d', $date);
    return $parsed && $parsed->format('Y-m-d') === $date;
}

function get_client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function rate_limit_or_fail(string $action, int $maxAttempts = PUBLIC_RATE_LIMIT_MAX, int $windowMinutes = PUBLIC_RATE_LIMIT_WINDOW_MINUTES): void
{
    $pdo = get_db_connection();
    $ip = get_client_ip();
    $windowStart = (new DateTimeImmutable('-' . $windowMinutes . ' minutes'))->format('Y-m-d H:i:s');

    $delete = $pdo->prepare('DELETE FROM rate_limits WHERE created_at < :window_start');
    $delete->execute([':window_start' => $windowStart]);

    $count = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_address = :ip_address AND action = :action AND created_at >= :window_start');
    $count->execute([
        ':ip_address' => $ip,
        ':action' => $action,
        ':window_start' => $windowStart,
    ]);

    if ((int) $count->fetchColumn() >= $maxAttempts) {
        json_response(false, 'Too many attempts. Please try again later.', 429);
    }

    $insert = $pdo->prepare('INSERT INTO rate_limits (ip_address, action, created_at) VALUES (:ip_address, :action, NOW())');
    $insert->execute([
        ':ip_address' => $ip,
        ':action' => $action,
    ]);
}

function get_bearer_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if (stripos($header, 'Bearer ') === 0) {
        return trim(substr($header, 7));
    }

    return '';
}

function require_admin_auth(): array
{
    $token = get_bearer_token();

    if ($token === '') {
        json_response(false, 'Authentication required.', 401);
    }

    $tokenHash = hash('sha256', $token);
    $pdo = get_db_connection();

    $stmt = $pdo->prepare(
        "SELECT s.id AS session_id, s.expires_at, u.id, u.name, u.email, u.role, u.is_active
         FROM admin_sessions s
         INNER JOIN admin_users u ON u.id = s.admin_user_id
         WHERE s.token_hash = :token_hash
           AND s.revoked_at IS NULL
           AND s.expires_at > NOW()
         LIMIT 1"
    );
    $stmt->execute([':token_hash' => $tokenHash]);
    $session = $stmt->fetch();

    if (!$session || (int) $session['is_active'] !== 1) {
        json_response(false, 'Invalid or expired session.', 401);
    }

    $touch = $pdo->prepare('UPDATE admin_sessions SET last_used_at = NOW() WHERE id = :id');
    $touch->execute([':id' => $session['session_id']]);

    return [
        'id' => (int) $session['id'],
        'name' => $session['name'],
        'email' => $session['email'],
        'role' => $session['role'],
    ];
}

function send_plain_email(string $to, string $subject, string $message, ?string $replyTo = null): bool
{
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';

    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    return mail($to, $subject, $message, implode("
", $headers));
}

function calculate_nights(string $checkInDate, string $checkOutDate): int
{
    $checkIn = new DateTime($checkInDate);
    $checkOut = new DateTime($checkOutDate);
    return max(1, (int) $checkIn->diff($checkOut)->days);
}

function calculate_booking_amount(string $roomName, string $checkInDate, string $checkOutDate): float
{
    $rate = (float) (ROOM_RATES[$roomName] ?? 0);
    return $rate * calculate_nights($checkInDate, $checkOutDate);
}
