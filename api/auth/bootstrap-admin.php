<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

apply_cors_headers();

/*
Run this file once locally or on cPanel to create the first admin user.
After successful creation, delete this file from the server.
Default email: admin@jebalhomes.com
Default password: ChangeThisPassword123!
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Only POST requests are allowed.', 405);
}

$data = read_request_data();
$name = clean_string($data['name'] ?? 'Jebal Homes Admin', 120);
$email = strtolower(clean_string($data['email'] ?? 'admin@jebalhomes.com', 190));
$password = (string) ($data['password'] ?? 'ChangeThisPassword123!');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Valid email is required.', 422);
}

if (strlen($password) < 10) {
    json_response(false, 'Password must be at least 10 characters.', 422);
}

try {
    $pdo = get_db_connection();
    $exists = $pdo->prepare('SELECT id FROM admin_users WHERE email = :email LIMIT 1');
    $exists->execute([':email' => $email]);

    if ($exists->fetch()) {
        json_response(false, 'Admin user already exists.', 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO admin_users (name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (:name, :email, :password_hash, :role, 1, NOW(), NOW())'
    );
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => 'admin',
    ]);

    json_response(true, 'Admin user created. Delete bootstrap-admin.php from the server now.', 201, [
        'data' => [
            'id' => (int) $pdo->lastInsertId(),
            'email' => $email,
        ],
    ]);
} catch (Throwable $e) {
    error_log('Admin bootstrap error: ' . $e->getMessage());
    json_response(false, 'Unable to create admin user.', 500);
}
