<?php
declare(strict_types=1);

/*
==================================================
JEBAL HOMES BACKEND CONFIGURATION LOADER
==================================================
Backend secrets are loaded from api/.env using vlucas/phpdotenv.

Production rule:
- Create api/.env from api/.env.example on the server.
- Keep api/.env out of Git and out of public sharing.
- Do not put database, SMTP, or PayHere secrets in frontend .env files.
- Switch local/production behavior using APP_ENV inside api/.env only.
*/

$autoloadFile = __DIR__ . '/vendor/autoload.php';

if (!is_file($autoloadFile)) {
    http_response_code(500);
    exit('Backend dependencies are missing. Run composer install in the api directory.');
}

require_once $autoloadFile;

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Throwable $exception) {
    http_response_code(500);
    exit('Backend environment file is missing or invalid. Copy api/.env.example to api/.env and configure it.');
}

/*
 |--------------------------------------------------------------------------
 | Application timezone
 |--------------------------------------------------------------------------
 | Booking holds, session expiry, rate limits, invoice timestamps, and any
 | PHP DateTime calculations must use the same timezone as the hotel/database.
 | Without this, pending booking holds can stay locked much longer than the
 | intended 15 minutes.
 */
$appTimezone = (string) ($_ENV['APP_TIMEZONE'] ?? $_SERVER['APP_TIMEZONE'] ?? 'Asia/Colombo');

if ($appTimezone === '') {
    $appTimezone = 'Asia/Colombo';
}

try {
    new DateTimeZone($appTimezone);
} catch (Throwable $exception) {
    $appTimezone = 'Asia/Colombo';
}

date_default_timezone_set($appTimezone);

function jebal_env_value(string $key, mixed $default = null): mixed
{
    if (array_key_exists($key, $_ENV)) {
        return $_ENV[$key];
    }

    if (array_key_exists($key, $_SERVER)) {
        return $_SERVER[$key];
    }

    return $default;
}

function jebal_define(string $name, mixed $value): void
{
    if (!defined($name)) {
        define($name, $value);
    }
}

function jebal_env_csv(string $key, array $default = []): array
{
    $value = jebal_env_value($key, '');

    if (is_array($value)) {
        return $value;
    }

    $items = array_filter(
        array_map('trim', explode(',', (string) $value)),
        static fn (string $item): bool => $item !== ''
    );

    return $items !== [] ? array_values($items) : $default;
}

function jebal_env_json_array(string $key, array $default = []): array
{
    $value = jebal_env_value($key, '');

    if (is_array($value)) {
        return $value;
    }

    $decoded = json_decode((string) $value, true);

    return is_array($decoded) && $decoded !== [] ? $decoded : $default;
}

function jebal_env_bool(string $key, bool $default = false): bool
{
    $value = jebal_env_value($key, $default ? 'true' : 'false');
    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    return $parsed ?? $default;
}

$defaultRoomRates = [
    'Ground Floor Room 1' => 8500.00,
    'Ground Floor Room 2' => 8500.00,
    'First Floor Room 1' => 9500.00,
    'First Floor Room 2' => 9500.00,
    'Family Room' => 14000.00,
    'Private Cottage' => 18000.00,
];

$appEnvironment = strtolower(trim((string) jebal_env_value('APP_ENV', '')));
if (!in_array($appEnvironment, ['local', 'development', 'testing', 'production'], true)) {
    http_response_code(500);
    exit('APP_ENV must be explicitly configured.');
}
jebal_define('APP_ENV', $appEnvironment);
jebal_define('APP_TIMEZONE', $appTimezone);
$frontendUrl = rtrim((string) jebal_env_value('FRONTEND_URL', jebal_env_value('PUBLIC_APP_URL', jebal_env_value('APP_BASE_URL', ''))), '/');
$publicAppUrl = $frontendUrl;
$adminAppUrl = rtrim((string) jebal_env_value('ADMIN_APP_URL', $publicAppUrl), '/');
$apiBaseUrl = rtrim((string) jebal_env_value('API_BASE_URL', ''), '/');
$assetBaseUrl = rtrim((string) jebal_env_value('ASSET_BASE_URL', ''), '/');

jebal_define('FRONTEND_URL', $frontendUrl);
jebal_define('APP_BASE_URL', $publicAppUrl);
jebal_define('PUBLIC_APP_URL', $publicAppUrl);
jebal_define('ADMIN_APP_URL', $adminAppUrl);
jebal_define('API_BASE_URL', $apiBaseUrl);
jebal_define('ASSET_BASE_URL', $assetBaseUrl !== '' ? $assetBaseUrl : $apiBaseUrl);
jebal_define('ONLINE_PAYMENT_ENABLED', jebal_env_bool('ONLINE_PAYMENT_ENABLED', false));

jebal_define('DB_HOST', (string) jebal_env_value('DB_HOST', ''));
jebal_define('DB_NAME', (string) jebal_env_value('DB_NAME', ''));
jebal_define('DB_USER', (string) jebal_env_value('DB_USER', ''));
jebal_define('DB_PASS', (string) jebal_env_value('DB_PASS', ''));
jebal_define('DB_CHARSET', (string) jebal_env_value('DB_CHARSET', 'utf8mb4'));

jebal_define('SMTP_HOST', (string) jebal_env_value('SMTP_HOST', ''));
jebal_define('SMTP_USER', (string) jebal_env_value('SMTP_USER', ''));
jebal_define('SMTP_PASS', (string) jebal_env_value('SMTP_PASS', ''));
jebal_define('SMTP_PORT', (int) jebal_env_value('SMTP_PORT', 587));
jebal_define('SMTP_SECURE', (string) jebal_env_value('SMTP_SECURE', 'tls'));
jebal_define('MAIL_CREDENTIAL_ENCRYPTION_KEY', (string) jebal_env_value('MAIL_CREDENTIAL_ENCRYPTION_KEY', ''));

jebal_define('ADMIN_EMAIL', (string) jebal_env_value('ADMIN_EMAIL', 'admin@jebalhomes.com'));
jebal_define('BOOKING_ADMIN_EMAIL', (string) jebal_env_value('BOOKING_ADMIN_EMAIL', 'bookings@jebalguesthouse.com'));
jebal_define('CONTACT_ADMIN_EMAIL', (string) jebal_env_value('CONTACT_ADMIN_EMAIL', 'info@jebalguesthouse.com'));

jebal_define('FROM_EMAIL', (string) jebal_env_value('FROM_EMAIL', 'info@jebalguesthouse.com'));
jebal_define('BOOKING_FROM_EMAIL', (string) jebal_env_value('BOOKING_FROM_EMAIL', 'bookings@jebalguesthouse.com'));
jebal_define('CONTACT_FROM_EMAIL', (string) jebal_env_value('CONTACT_FROM_EMAIL', 'info@jebalguesthouse.com'));
jebal_define('ADMIN_FROM_EMAIL', (string) jebal_env_value('ADMIN_FROM_EMAIL', jebal_env_value('ADMIN_EMAIL', 'admin@jebalguesthouse.com')));

jebal_define('FROM_NAME', (string) jebal_env_value('FROM_NAME', 'Jebal Homes'));
jebal_define('BOOKING_FROM_NAME', (string) jebal_env_value('BOOKING_FROM_NAME', 'Jebal Guest House Bookings'));
jebal_define('CONTACT_FROM_NAME', (string) jebal_env_value('CONTACT_FROM_NAME', 'Jebal Guest House'));
jebal_define('ADMIN_FROM_NAME', (string) jebal_env_value('ADMIN_FROM_NAME', 'Jebal Guest House Admin'));

/*
 | Separate SMTP profiles.
 | This prevents spoofing. Booking emails authenticate as bookings@,
 | contact emails authenticate as info@, and reminder/admin emails authenticate as admin@.
 | If all three cPanel email accounts use the same password, keep one SMTP_PASS and
 | omit the *_SMTP_PASS values; each profile will reuse SMTP_PASS.
 */
jebal_define('BOOKING_SMTP_HOST', (string) jebal_env_value('BOOKING_SMTP_HOST', jebal_env_value('SMTP_HOST', '')));
jebal_define('BOOKING_SMTP_USER', (string) jebal_env_value('BOOKING_SMTP_USER', jebal_env_value('BOOKING_FROM_EMAIL', 'bookings@jebalguesthouse.com')));
jebal_define('BOOKING_SMTP_PASS', (string) jebal_env_value('BOOKING_SMTP_PASS', jebal_env_value('SMTP_PASS', '')));
jebal_define('BOOKING_SMTP_PORT', (int) jebal_env_value('BOOKING_SMTP_PORT', jebal_env_value('SMTP_PORT', 587)));
jebal_define('BOOKING_SMTP_SECURE', (string) jebal_env_value('BOOKING_SMTP_SECURE', jebal_env_value('SMTP_SECURE', 'tls')));

jebal_define('CONTACT_SMTP_HOST', (string) jebal_env_value('CONTACT_SMTP_HOST', jebal_env_value('SMTP_HOST', '')));
jebal_define('CONTACT_SMTP_USER', (string) jebal_env_value('CONTACT_SMTP_USER', jebal_env_value('CONTACT_FROM_EMAIL', 'info@jebalguesthouse.com')));
jebal_define('CONTACT_SMTP_PASS', (string) jebal_env_value('CONTACT_SMTP_PASS', jebal_env_value('SMTP_PASS', '')));
jebal_define('CONTACT_SMTP_PORT', (int) jebal_env_value('CONTACT_SMTP_PORT', jebal_env_value('SMTP_PORT', 587)));
jebal_define('CONTACT_SMTP_SECURE', (string) jebal_env_value('CONTACT_SMTP_SECURE', jebal_env_value('SMTP_SECURE', 'tls')));

jebal_define('ADMIN_SMTP_HOST', (string) jebal_env_value('ADMIN_SMTP_HOST', jebal_env_value('SMTP_HOST', '')));
jebal_define('ADMIN_SMTP_USER', (string) jebal_env_value('ADMIN_SMTP_USER', jebal_env_value('ADMIN_FROM_EMAIL', jebal_env_value('ADMIN_EMAIL', 'admin@jebalguesthouse.com'))));
jebal_define('ADMIN_SMTP_PASS', (string) jebal_env_value('ADMIN_SMTP_PASS', jebal_env_value('SMTP_PASS', '')));
jebal_define('ADMIN_SMTP_PORT', (int) jebal_env_value('ADMIN_SMTP_PORT', jebal_env_value('SMTP_PORT', 587)));
jebal_define('ADMIN_SMTP_SECURE', (string) jebal_env_value('ADMIN_SMTP_SECURE', jebal_env_value('SMTP_SECURE', 'tls')));

jebal_define('PAYHERE_MERCHANT_ID', (string) jebal_env_value('PAYHERE_MERCHANT_ID', ''));
jebal_define('PAYHERE_MERCHANT_SECRET', (string) jebal_env_value('PAYHERE_MERCHANT_SECRET', ''));
jebal_define('PUBLIC_LINK_SIGNING_KEY', (string) jebal_env_value('PUBLIC_LINK_SIGNING_KEY', ''));
jebal_define('PUBLIC_LINK_TTL_SECONDS', (int) jebal_env_value('PUBLIC_LINK_TTL_SECONDS', 86400));
jebal_define('INVOICE_LINK_TTL_SECONDS', (int) jebal_env_value('INVOICE_LINK_TTL_SECONDS', 604800));
jebal_define('PUBLIC_LINK_LEGACY_UNTIL', (string) jebal_env_value('PUBLIC_LINK_LEGACY_UNTIL', ''));

jebal_define('ALLOWED_ORIGINS', jebal_env_csv('ALLOWED_ORIGINS'));

jebal_define('PAYMENT_CURRENCY', 'USD');
jebal_define(
    'INVOICE_PUBLIC_BASE_URL',
    $apiBaseUrl . '/invoices/download.php'
);
jebal_define('INVOICE_STORAGE_DIR', __DIR__ . '/storage/invoices');

jebal_define('ADMIN_SESSION_HOURS', (int) jebal_env_value('ADMIN_SESSION_HOURS', 12));
jebal_define('ADMIN_IDLE_TIMEOUT_MINUTES', (int) jebal_env_value('ADMIN_IDLE_TIMEOUT_MINUTES', 30));
jebal_define('ADMIN_AUTH_COOKIE', (string) jebal_env_value('ADMIN_AUTH_COOKIE', 'jebal_admin_session'));
jebal_define('ADMIN_CSRF_COOKIE', (string) jebal_env_value('ADMIN_CSRF_COOKIE', 'jebal_admin_csrf'));
jebal_define('ADMIN_ALLOW_BEARER_AUTH', filter_var(jebal_env_value('ADMIN_ALLOW_BEARER_AUTH', 'false'), FILTER_VALIDATE_BOOLEAN));
jebal_define('PUBLIC_RATE_LIMIT_MAX', (int) jebal_env_value('PUBLIC_RATE_LIMIT_MAX', 8));
jebal_define('PUBLIC_RATE_LIMIT_WINDOW_MINUTES', (int) jebal_env_value('PUBLIC_RATE_LIMIT_WINDOW_MINUTES', 15));

jebal_define('ROOM_RATES', jebal_env_json_array('ROOM_RATES', $defaultRoomRates));

if (defined('APP_ENV') && APP_ENV === 'production') {
    $requiredProductionValues = [
        'FRONTEND_URL' => FRONTEND_URL,
        'ADMIN_APP_URL' => ADMIN_APP_URL,
        'API_BASE_URL' => API_BASE_URL,
        'DB_HOST' => DB_HOST,
        'DB_NAME' => DB_NAME,
        'DB_USER' => DB_USER,
        'DB_PASS' => DB_PASS,
        'PAYHERE_MERCHANT_ID' => PAYHERE_MERCHANT_ID,
        'PAYHERE_MERCHANT_SECRET' => PAYHERE_MERCHANT_SECRET,
        'PUBLIC_LINK_SIGNING_KEY' => PUBLIC_LINK_SIGNING_KEY,
    ];
    foreach ($requiredProductionValues as $key => $value) {
        if (trim((string) $value) === '') {
            http_response_code(500);
            exit('Required production configuration is missing: ' . $key);
        }
    }
    if (strtolower(DB_USER) === 'root') {
        http_response_code(500);
        exit('Production database root access is forbidden.');
    }
    if (strlen(PUBLIC_LINK_SIGNING_KEY) < 32) {
        http_response_code(500);
        exit('PUBLIC_LINK_SIGNING_KEY must contain at least 32 characters.');
    }
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
} else {
    // API responses must stay machine-readable in local/development too.
    // Warnings/notices are written to the PHP error log instead of being
    // injected before JSON and breaking response.json() in the frontend.
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
}
