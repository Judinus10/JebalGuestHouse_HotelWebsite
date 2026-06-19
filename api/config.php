<?php
declare(strict_types=1);

/*
==================================================
JEBAL HOMES BACKEND CONFIGURATION
==================================================
Local development values:
- DB_HOST: localhost
- DB_NAME: hotel_jebal
- DB_USER: root
- DB_PASS: empty string

Production cPanel values:
- Replace DB_NAME with the cPanel database name, usually cpaneluser_database.
- Replace DB_USER with the cPanel database user, usually cpaneluser_dbuser.
- Replace DB_PASS with the strong database user password.
- Replace ALLOWED_ORIGINS with the real public website and admin dashboard URLs.
- Replace ADMIN_EMAIL/FROM_EMAIL with real mailbox addresses created in cPanel.
- Set APP_ENV to production.

Only this file should be edited when moving servers.
Do not hardcode database credentials in API endpoint files.
*/

const APP_ENV = 'local'; // local | production

const DB_HOST = 'localhost';
const DB_NAME = 'hotel_jebal';
const DB_USER = 'root';
const DB_PASS = '';
const DB_CHARSET = 'utf8mb4';

const ADMIN_EMAIL = 'admin@jebalhomes.com';
const FROM_EMAIL = 'info@jebalhomes.com';
const FROM_NAME = 'Jebal Homes';

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://jebalhomes.com',
    'https://www.jebalhomes.com',
    'https://admin.jebalhomes.com',
];

const ADMIN_SESSION_HOURS = 12;
const PUBLIC_RATE_LIMIT_MAX = 8;
const PUBLIC_RATE_LIMIT_WINDOW_MINUTES = 15;

const ROOM_RATES = [
    'Ground Floor Room 1' => 8500.00,
    'Ground Floor Room 2' => 8500.00,
    'First Floor Room 1' => 9500.00,
    'First Floor Room 2' => 9500.00,
    'Family Room' => 14000.00,
    'Private Cottage' => 18000.00,
];

if (APP_ENV === 'production') {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
}
