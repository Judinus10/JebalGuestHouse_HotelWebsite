<?php
declare(strict_types=1);

/*
==================================================
JEBAL HOMES BACKEND CONFIGURATION LOADER
==================================================
Backend secrets are centralized in api/env.php.

Production rule:
- Create api/env.php from api/env.example.php on the server.
- Keep api/env.php out of Git and out of public sharing.
- Do not put database, SMTP, or PayHere secrets in frontend .env files.
- Switch local/production behavior using APP_ENV inside api/env.php only.
*/

$envFile = __DIR__ . '/env.php';

if (!is_file($envFile)) {
    http_response_code(500);
    exit('Backend environment file is missing. Copy api/env.example.php to api/env.php and configure it.');
}

$env = require $envFile;

if (!is_array($env)) {
    http_response_code(500);
    exit('Backend environment file must return a configuration array.');
}

function jebal_env_value(array $env, string $key, mixed $default = null): mixed
{
    return array_key_exists($key, $env) ? $env[$key] : $default;
}

function jebal_define(string $name, mixed $value): void
{
    if (!defined($name)) {
        define($name, $value);
    }
}

jebal_define('APP_ENV', (string) jebal_env_value($env, 'APP_ENV', 'local'));
jebal_define('APP_BASE_URL', rtrim((string) jebal_env_value($env, 'APP_BASE_URL', ''), '/'));
jebal_define('API_BASE_URL', rtrim((string) jebal_env_value($env, 'API_BASE_URL', ''), '/'));

jebal_define('DB_HOST', (string) jebal_env_value($env, 'DB_HOST', 'localhost'));
jebal_define('DB_NAME', (string) jebal_env_value($env, 'DB_NAME', 'hotel_jebal'));
jebal_define('DB_USER', (string) jebal_env_value($env, 'DB_USER', 'root'));
jebal_define('DB_PASS', (string) jebal_env_value($env, 'DB_PASS', ''));
jebal_define('DB_CHARSET', (string) jebal_env_value($env, 'DB_CHARSET', 'utf8mb4'));

jebal_define('SMTP_HOST', (string) jebal_env_value($env, 'SMTP_HOST', ''));
jebal_define('SMTP_USER', (string) jebal_env_value($env, 'SMTP_USER', ''));
jebal_define('SMTP_PASS', (string) jebal_env_value($env, 'SMTP_PASS', ''));
jebal_define('SMTP_PORT', (int) jebal_env_value($env, 'SMTP_PORT', 587));
jebal_define('SMTP_SECURE', (string) jebal_env_value($env, 'SMTP_SECURE', 'tls'));

jebal_define('ADMIN_EMAIL', (string) jebal_env_value($env, 'ADMIN_EMAIL', 'admin@jebalhomes.com'));
jebal_define('FROM_EMAIL', (string) jebal_env_value($env, 'FROM_EMAIL', 'info@jebalhomes.com'));
jebal_define('FROM_NAME', (string) jebal_env_value($env, 'FROM_NAME', 'Jebal Homes'));

jebal_define('PAYHERE_MERCHANT_ID', (string) jebal_env_value($env, 'PAYHERE_MERCHANT_ID', ''));
jebal_define('PAYHERE_MERCHANT_SECRET', (string) jebal_env_value($env, 'PAYHERE_MERCHANT_SECRET', ''));

$allowedOrigins = jebal_env_value($env, 'ALLOWED_ORIGINS', []);
if (!is_array($allowedOrigins)) {
    $allowedOrigins = [];
}
jebal_define('ALLOWED_ORIGINS', $allowedOrigins);

jebal_define('PAYMENT_CURRENCY', (string) jebal_env_value($env, 'PAYMENT_CURRENCY', 'LKR'));
jebal_define(
    'INVOICE_PUBLIC_BASE_URL',
    (API_BASE_URL !== '' ? API_BASE_URL : 'http://localhost/HotelWebsite/api') . '/invoices/download.php'
);
jebal_define('INVOICE_STORAGE_DIR', __DIR__ . '/storage/invoices');

jebal_define('ADMIN_SESSION_HOURS', (int) jebal_env_value($env, 'ADMIN_SESSION_HOURS', 12));
jebal_define('PUBLIC_RATE_LIMIT_MAX', (int) jebal_env_value($env, 'PUBLIC_RATE_LIMIT_MAX', 8));
jebal_define('PUBLIC_RATE_LIMIT_WINDOW_MINUTES', (int) jebal_env_value($env, 'PUBLIC_RATE_LIMIT_WINDOW_MINUTES', 15));

$roomRates = jebal_env_value($env, 'ROOM_RATES', [
    'Ground Floor Room 1' => 8500.00,
    'Ground Floor Room 2' => 8500.00,
    'First Floor Room 1' => 9500.00,
    'First Floor Room 2' => 9500.00,
    'Family Room' => 14000.00,
    'Private Cottage' => 18000.00,
]);

if (!is_array($roomRates) || $roomRates === []) {
    $roomRates = [
        'Ground Floor Room 1' => 8500.00,
        'Ground Floor Room 2' => 8500.00,
        'First Floor Room 1' => 9500.00,
        'First Floor Room 2' => 9500.00,
        'Family Room' => 14000.00,
        'Private Cottage' => 18000.00,
    ];
}

jebal_define('ROOM_RATES', $roomRates);

if (APP_ENV === 'production') {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    ini_set('log_errors', '1');
    error_reporting(E_ALL);
}
