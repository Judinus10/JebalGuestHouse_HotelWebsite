<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

try {
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->SMTPDebug = 2;

    $mail->Debugoutput = function ($str, $level) {
        echo 'DEBUG [' . $level . '] : ' . htmlspecialchars($str, ENT_QUOTES, 'UTF-8') . '<br>';
    };

    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->Port = (int) SMTP_PORT;

    if (strtolower((string) SMTP_SECURE) === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    }

    if (APP_ENV === 'local') {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];
    }

    $mail->CharSet = 'UTF-8';
    $mail->setFrom(FROM_EMAIL, FROM_NAME);

    // Change this to your real receiving email
    $mail->addAddress('jjudinas@gmail.com');

    $mail->Subject = 'Jebal SMTP Test';
    $mail->Body = 'SMTP test successful.';

    $mail->send();

    echo '<h2>EMAIL SENT SUCCESSFULLY</h2>';
} catch (Throwable $e) {
    echo '<h2>EMAIL FAILED</h2>';
    echo '<pre>';
    echo htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
    echo '</pre>';
}