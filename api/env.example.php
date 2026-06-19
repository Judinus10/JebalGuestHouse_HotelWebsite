<?php
declare(strict_types=1);

/*
==================================================
JEBAL HOMES BACKEND ENVIRONMENT EXAMPLE
==================================================
Copy this file to api/env.php and replace placeholders.
Never commit or publicly share api/env.php.
*/

return [
    'APP_ENV' => 'production',

    'APP_BASE_URL' => 'https://your-domain.example',
    'API_BASE_URL' => 'https://your-domain.example/api',

    'DB_HOST' => 'localhost',
    'DB_NAME' => 'cpaneluser_database',
    'DB_USER' => 'cpaneluser_dbuser',
    'DB_PASS' => 'REPLACE_WITH_STRONG_DATABASE_PASSWORD',
    'DB_CHARSET' => 'utf8mb4',

    'SMTP_HOST' => 'mail.your-domain.example',
    'SMTP_USER' => 'info@your-domain.example',
    'SMTP_PASS' => 'REPLACE_WITH_SMTP_PASSWORD',
    'SMTP_PORT' => 587,
    'SMTP_SECURE' => 'tls',

    'ADMIN_EMAIL' => 'admin@your-domain.example',
    'FROM_EMAIL' => 'info@your-domain.example',
    'FROM_NAME' => 'Jebal Homes',

    'PAYHERE_MERCHANT_ID' => 'REPLACE_WITH_PAYHERE_MERCHANT_ID',
    'PAYHERE_MERCHANT_SECRET' => 'REPLACE_WITH_PAYHERE_MERCHANT_SECRET',

    'ALLOWED_ORIGINS' => [
        'https://your-domain.example',
        'https://www.your-domain.example',
        'https://admin.your-domain.example',
    ],
];
