<?php
/**
 * Public website contact form submission endpoint.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db.php';

handle_preflight_request();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json_response(false, 'Only POST requests are allowed.', 405);
}

$input = read_request_data();

$name = clean_string($input['name'] ?? '');
$email = clean_string($input['email'] ?? '');
$phone = clean_string($input['phone'] ?? '');
$subject = clean_string($input['subject'] ?? 'General Inquiry');
$message = clean_string($input['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    api_json_response(false, 'Name, email, and message are required.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_json_response(false, 'Please provide a valid email address.', 422);
}

if (mb_strlen($name) > 150 || mb_strlen($email) > 190 || mb_strlen($phone) > 50 || mb_strlen($subject) > 190) {
    api_json_response(false, 'One or more fields are too long.', 422);
}

if (mb_strlen($message) > 5000) {
    api_json_response(false, 'Message is too long.', 422);
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->prepare(
        'INSERT INTO enquiries (name, email, phone, subject, message, status, created_at, updated_at)
         VALUES (:name, :email, :phone, :subject, :message, :status, NOW(), NOW())'
    );

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':subject' => $subject,
        ':message' => $message,
        ':status' => 'New',
    ]);

    $enquiryId = (int) $pdo->lastInsertId();
    $publicInquiryId = 'INQ-' . str_pad((string) $enquiryId, 5, '0', STR_PAD_LEFT);

    $adminSubject = 'New Contact Enquiry - ' . $publicInquiryId;
    $adminMessage = "New contact enquiry received.\n\n"
        . "Inquiry ID: {$publicInquiryId}\n"
        . "Name: {$name}\n"
        . "Email: {$email}\n"
        . "Phone: {$phone}\n"
        . "Subject: {$subject}\n\n"
        . "Message:\n{$message}\n";

    send_plain_email(ADMIN_EMAIL, $adminSubject, $adminMessage, $email);

    $customerSubject = 'We received your message - Jebal Homes';
    $customerMessage = "Dear {$name},\n\n"
        . "Thank you for contacting Jebal Homes. We have received your message and will get back to you as soon as possible.\n\n"
        . "Your enquiry reference: {$publicInquiryId}\n\n"
        . "Regards,\nJebal Homes";

    send_plain_email($email, $customerSubject, $customerMessage);

    api_json_response(true, 'Your message has been sent successfully.', 200, [
        'id' => $enquiryId,
        'inquiry_id' => $publicInquiryId,
    ]);
} catch (Throwable $e) {
    error_log('Contact submit error: ' . $e->getMessage());
    api_json_response(false, 'Could not save your enquiry. Please try again.', 500);
}

