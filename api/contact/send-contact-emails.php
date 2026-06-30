<?php
declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../mail/email-helper.php';

$isCli = PHP_SAPI === 'cli';

if (!$isCli) {
    apply_cors_headers();
}

try {
    $pdo = get_db_connection();

    $stmt = $pdo->query(
        "SELECT e.id, e.name, e.email, e.phone, e.subject, e.message
         FROM enquiries e
         WHERE NOT EXISTS (
             SELECT 1 FROM email_logs l
             WHERE l.enquiry_id = e.id
               AND l.email_type = 'admin_contact_enquiry'
               AND l.status = 'Sent'
         )
         OR NOT EXISTS (
             SELECT 1 FROM email_logs l
             WHERE l.enquiry_id = e.id
               AND l.email_type = 'contact_auto_reply'
               AND l.status = 'Sent'
         )
         ORDER BY e.id ASC
         LIMIT 20"
    );

    $sentCount = 0;
    $failedCount = 0;

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        try {
            send_contact_enquiry_emails(
                $pdo,
                (int) $row['id'],
                (string) $row['name'],
                (string) $row['email'],
                (string) ($row['phone'] ?? ''),
                (string) ($row['subject'] ?? 'General Inquiry'),
                (string) $row['message']
            );
            $sentCount++;
        } catch (Throwable $e) {
            $failedCount++;
            error_log('Contact email worker failed for enquiry #' . (int) $row['id'] . ': ' . $e->getMessage());
        }
    }

    $payload = [
        'processed' => $sentCount + $failedCount,
        'success_count' => $sentCount,
        'failed_count' => $failedCount,
    ];

    if ($isCli) {
        echo json_encode($payload, JSON_PRETTY_PRINT) . PHP_EOL;
        exit;
    }

    json_response(true, 'Contact email worker completed.', 200, ['data' => $payload]);
} catch (Throwable $e) {
    error_log('Contact email worker error: ' . $e->getMessage());

    if ($isCli) {
        fwrite(STDERR, 'Contact email worker error: ' . $e->getMessage() . PHP_EOL);
        exit(1);
    }

    json_response(false, 'Contact email worker failed.', 500);
}
