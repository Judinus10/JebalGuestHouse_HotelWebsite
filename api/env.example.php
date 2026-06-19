<?php
declare(strict_types=1);

/*
==================================================
JEBAL HOMES BACKEND ENVIRONMENT EXAMPLE
==================================================
Copy this file to api/env.php and replace placeholders.
Never commit or publicly share api/env.php.

Only api/env.php should contain real backend credentials.
Frontend .env files must only contain public API URLs.
*/

return [
    'APP_ENV' => 'production',

    'APP_BASE_URL' => 'https://jebalhomes.com',
    'API_BASE_URL' => 'https://jebalhomes.com/api',

    'DB_HOST' => 'localhost',
    'DB_NAME' => 'cpaneluser_database',
    'DB_USER' => 'cpaneluser_dbuser',
    'DB_PASS' => 'REPLACE_WITH_STRONG_DATABASE_PASSWORD',
    'DB_CHARSET' => 'utf8mb4',

    'SMTP_HOST' => 'mail.jebalhomes.com',
    'SMTP_USER' => 'info@jebalhomes.com',
    'SMTP_PASS' => 'REPLACE_WITH_EMAIL_PASSWORD',
    'SMTP_PORT' => 587,
    'SMTP_SECURE' => 'tls',

    'ADMIN_EMAIL' => 'admin@jebalhomes.com',
    'FROM_EMAIL' => 'info@jebalhomes.com',
    'FROM_NAME' => 'Jebal Homes',

    'PAYHERE_MERCHANT_ID' => 'REPLACE_WITH_PAYHERE_MERCHANT_ID',
    'PAYHERE_MERCHANT_SECRET' => 'REPLACE_WITH_PAYHERE_MERCHANT_SECRET',

    'PAYMENT_CURRENCY' => 'LKR',

    'ALLOWED_ORIGINS' => [
        'https://jebalhomes.com',
        'https://www.jebalhomes.com',
        'https://admin.jebalhomes.com',
    ],

    'ADMIN_SESSION_HOURS' => 12,
    'PUBLIC_RATE_LIMIT_MAX' => 8,
    'PUBLIC_RATE_LIMIT_WINDOW_MINUTES' => 15,

    'ROOM_RATES' => [
        'Ground Floor Room 1' => 8500.00,
        'Ground Floor Room 2' => 8500.00,
        'First Floor Room 1' => 9500.00,
        'First Floor Room 2' => 9500.00,
        'Family Room' => 14000.00,
        'Private Cottage' => 18000.00,
    ],
];
