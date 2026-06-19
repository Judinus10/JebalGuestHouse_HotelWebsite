<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

apply_cors_headers();
$user = require_admin_auth();

json_response(true, 'Session is valid.', 200, [
    'data' => [
        'user' => $user,
    ],
]);