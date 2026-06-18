<?php
/**
 * Jebal Homes API central configuration.
 *
 * EDIT THIS FILE ONLY when moving from local development to cPanel hosting.
 * Do not hardcode database credentials inside individual API endpoints.
 */

declare(strict_types=1);

/**
 * ENVIRONMENT
 * local      = local XAMPP/WAMP/Laragon development
 * production = cPanel / live hosting
 */
const APP_ENV = 'local';

/**
 * DATABASE CONFIGURATION - LOCAL DEVELOPMENT
 * Current local database values supplied for this project.
 *
 * For cPanel production, replace these values with your hosting database values:
 * DB_HOST: usually 'localhost' unless hosting provider gives another host
 * DB_NAME: usually 'cpanelusername_database'
 * DB_USER: usually 'cpanelusername_dbuser'
 * DB_PASS: the password assigned to the database user
 */
const DB_HOST = 'localhost';
const DB_NAME = 'hotel_jebal';
const DB_USER = 'root';
const DB_PASS = '';
const DB_CHARSET = 'utf8mb4';

/**
 * CORS CONFIGURATION
 * Add the public website URL and admin dashboard URL here.
 * Keep localhost URLs for local Vite development.
 */
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'https://jebalhomes.com',
    'https://www.jebalhomes.com',
    'https://admin.jebalhomes.com',
];

/**
 * EMAIL CONFIGURATION
 * For local development, PHP mail() may not send unless your local mail server is configured.
 * On cPanel, use real domain emails.
 */
const ADMIN_EMAIL = 'reservations@jebalhomes.com';
const FROM_EMAIL = 'no-reply@jebalhomes.com';
const FROM_NAME = 'Jebal Homes';

/**
 * BASIC ROOM RATES
 * This is only used to show/save an estimated booking amount in the admin bookings table.
 * This is not a payment gateway integration.
 */
const DEFAULT_CURRENCY = 'LKR';
const ROOM_RATES = [
    'Ground Floor Room 1' => 7500,
    'Ground Floor Room 2' => 7500,
    'First Floor Room 1' => 8500,
    'First Floor Room 2' => 8500,
    'Family Room' => 12000,
    'Private Cottage' => 15000,
];
