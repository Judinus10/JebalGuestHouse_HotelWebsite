<?php
/**
 * Email automation helper for Jebal Guest House.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

function send_html_email(string $to, string $subject, string $htmlBody, ?string $replyTo = null): bool
{
    try {
        if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
            error_log('PHPMailer class not found. Check vendor/autoload.php path.');
            return false;
        }

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        $smtpHost = defined('SMTP_HOST') ? trim((string) SMTP_HOST) : '';
        $smtpUser = defined('SMTP_USER') ? trim((string) SMTP_USER) : '';
        $smtpPass = defined('SMTP_PASS') ? trim((string) SMTP_PASS) : '';
        $smtpPort = defined('SMTP_PORT') ? (int) SMTP_PORT : 0;
        $smtpSecure = defined('SMTP_SECURE') ? strtolower(trim((string) SMTP_SECURE)) : 'tls';
        $fromEmail = defined('FROM_EMAIL') ? trim((string) FROM_EMAIL) : '';
        $fromName = defined('FROM_NAME') ? trim((string) FROM_NAME) : 'Jebal Guest House';

        if ($smtpHost === '' || $smtpUser === '' || $smtpPass === '' || $smtpPort < 1 || $fromEmail === '') {
            error_log('SMTP configuration missing for HTML email.');
            return false;
        }

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log('Invalid recipient email: ' . $to);
            return false;
        }

        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->SMTPAuth = true;
        $mail->Username = $smtpUser;
        $mail->Password = $smtpPass;
        $mail->Port = $smtpPort;

        if ($smtpSecure === 'ssl') {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        } elseif ($smtpSecure === 'tls') {
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        }

        if (defined('APP_ENV') && APP_ENV === 'local') {
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ];
        }

        $mail->CharSet = 'UTF-8';
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($to);

        if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
            $mail->addReplyTo($replyTo);
        }

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = strip_tags($htmlBody);

        return $mail->send();
    } catch (Throwable $e) {
        error_log('PHPMailer HTML send failed: ' . $e->getMessage());
        return false;
    }
}

function track_email(PDO $pdo, string $relatedType, ?int $relatedId, string $to, string $subject, string $emailType, bool $sent, ?string $errorMessage = null): void
{
    $bookingId = $relatedType === 'booking' ? $relatedId : null;
    $enquiryId = $relatedType === 'enquiry' ? $relatedId : null;

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO email_logs (booking_id, enquiry_id, recipient_email, subject, email_type, status, error_message, sent_at)
             VALUES (:booking_id, :enquiry_id, :recipient_email, :subject, :email_type, :status, :error_message, :sent_at)'
        );

        $stmt->execute([
            ':booking_id' => $bookingId,
            ':enquiry_id' => $enquiryId,
            ':recipient_email' => $to,
            ':subject' => $subject,
            ':email_type' => $emailType,
            ':status' => $sent ? 'Sent' : 'Failed',
            ':error_message' => $errorMessage,
            ':sent_at' => $sent ? date('Y-m-d H:i:s') : null,
        ]);
    } catch (Throwable $e) {
        error_log('Email log insert failed: ' . $e->getMessage());
    }
}

function send_tracked_email(PDO $pdo, string $relatedType, ?int $relatedId, string $to, string $subject, string $htmlBody, string $emailType, ?string $replyTo = null): bool
{
    $sent = send_html_email($to, $subject, $htmlBody, $replyTo);

    track_email(
        $pdo,
        $relatedType,
        $relatedId,
        $to,
        $subject,
        $emailType,
        $sent,
        $sent ? null : 'PHPMailer returned false'
    );

    return $sent;
}

function update_booking_email_status(PDO $pdo, int $bookingId, string $status): void
{
    try {
        $stmt = $pdo->prepare('UPDATE bookings SET email_status = :status, updated_at = NOW() WHERE id = :id');
        $stmt->execute([
            ':status' => $status,
            ':id' => $bookingId,
        ]);
    } catch (Throwable $e) {
        error_log('Booking email status update failed: ' . $e->getMessage());
    }
}

function booking_details_html(array $booking): string
{
    return '
        <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
            <tr><td><strong>Booking ID</strong></td><td>#' . email_safe((string) ($booking['id'] ?? '')) . '</td></tr>
            <tr><td><strong>Customer</strong></td><td>' . email_safe($booking['full_name'] ?? $booking['guest_name'] ?? '') . '</td></tr>
            <tr><td><strong>Room</strong></td><td>' . email_safe($booking['room_name'] ?? '') . '</td></tr>
            <tr><td><strong>Check-in</strong></td><td>' . email_safe($booking['check_in_date'] ?? '') . '</td></tr>
            <tr><td><strong>Check-out</strong></td><td>' . email_safe($booking['check_out_date'] ?? '') . '</td></tr>
            <tr><td><strong>Guests</strong></td><td>' . email_safe((string) ($booking['guests'] ?? '')) . '</td></tr>
            <tr><td><strong>Booking Status</strong></td><td>' . email_safe($booking['status'] ?? $booking['booking_status'] ?? '') . '</td></tr>
            <tr><td><strong>Payment Status</strong></td><td>' . email_safe($booking['payment_status'] ?? '') . '</td></tr>
        </table>';
}

function email_shell(string $title, string $content): string
{
    return '<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
        <div style="max-width:680px;margin:auto;background:white;border-radius:14px;padding:24px;border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 14px;color:#0f172a;">' . email_safe($title) . '</h2>
            ' . $content . '
            <p style="margin-top:24px;color:#475569;">Regards,<br><strong>Jebal Guest House</strong></p>
        </div>
    </div>';
}

function invoice_download_link(array $booking): string
{
    $bookingId = (int) ($booking['id'] ?? 0);
    $secret = defined('PAYHERE_MERCHANT_SECRET') ? (string) PAYHERE_MERCHANT_SECRET : '';

    if ($bookingId < 1 || $secret === '') {
        return '';
    }

    $token = hash_hmac('sha256', (string) $bookingId, $secret);

    return INVOICE_PUBLIC_BASE_URL . '?id=' . $bookingId . '&token=' . $token;
}

function send_booking_received_emails(PDO $pdo, array $booking): void
{
    $subjectCustomer = 'Booking inquiry received - Jebal Guest House #' . $booking['id'];

    $bodyCustomer = email_shell(
        'Booking inquiry received',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>We received your booking inquiry. We will review it and contact you if any details are required.</p>' .
        booking_details_html($booking)
    );

    $sentCustomer = send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        $booking['email'],
        $subjectCustomer,
        $bodyCustomer,
        'booking_inquiry_received'
    );

    $subjectAdmin = 'New booking received - Jebal Guest House #' . $booking['id'];

    $bodyAdmin = email_shell(
        'New booking received',
        '<p>A new booking inquiry has been submitted.</p>' . booking_details_html($booking)
    );

    send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        ADMIN_EMAIL,
        $subjectAdmin,
        $bodyAdmin,
        'admin_new_booking',
        $booking['email'] ?? null
    );

    update_booking_email_status($pdo, (int) $booking['id'], $sentCustomer ? 'Sent' : 'Failed');
}

function send_booking_confirmed_email(PDO $pdo, array $booking): void
{
    $invoiceLink = '';
    $downloadLink = invoice_download_link($booking);

    if (!empty($booking['invoice_number']) && $downloadLink !== '') {
        $invoiceLink = '<p><a href="' . email_safe($downloadLink) . '">Download your invoice</a></p>';
    }

    $subject = 'Booking confirmed - Jebal Guest House #' . $booking['id'];

    $body = email_shell(
        'Booking confirmed',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your booking has been confirmed.</p>' .
        booking_details_html($booking) .
        $invoiceLink
    );

    $sent = send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        $booking['email'],
        $subject,
        $body,
        'booking_confirmed'
    );

    update_booking_email_status($pdo, (int) $booking['id'], $sent ? 'Sent' : 'Failed');
}

function send_booking_cancelled_emails(PDO $pdo, array $booking): void
{
    $subjectCustomer = 'Booking cancelled - Jebal Guest House #' . $booking['id'];

    $bodyCustomer = email_shell(
        'Booking cancelled',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your booking has been cancelled. Contact us if this was unexpected.</p>' .
        booking_details_html($booking)
    );

    $sentCustomer = send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        $booking['email'],
        $subjectCustomer,
        $bodyCustomer,
        'booking_cancelled'
    );

    $subjectAdmin = 'Booking cancelled - Jebal Guest House #' . $booking['id'];

    $bodyAdmin = email_shell(
        'Booking cancelled',
        '<p>A booking was cancelled.</p>' . booking_details_html($booking)
    );

    send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        ADMIN_EMAIL,
        $subjectAdmin,
        $bodyAdmin,
        'admin_booking_cancelled'
    );

    update_booking_email_status($pdo, (int) $booking['id'], $sentCustomer ? 'Sent' : 'Failed');
}

function send_payment_success_emails(PDO $pdo, array $booking, array $payment): void
{
    $downloadLink = invoice_download_link($booking);
    $invoiceLink = $downloadLink !== ''
        ? '<p><a href="' . email_safe($downloadLink) . '">Download your invoice</a></p>'
        : '';

    $amount = email_safe(format_money_amount((float) ($payment['amount'] ?? 0)));

    $subjectCustomer = 'Payment successful - Jebal Guest House #' . $booking['id'];

    $bodyCustomer = email_shell(
        'Payment successful',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your PayHere payment was successful.</p>
        <p><strong>Amount Paid:</strong> ' . $amount . '</p>' .
        $invoiceLink .
        booking_details_html($booking)
    );

    $sentCustomer = send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        $booking['email'],
        $subjectCustomer,
        $bodyCustomer,
        'payment_successful'
    );

    $subjectAdmin = 'Payment received - Jebal Guest House #' . $booking['id'];

    $bodyAdmin = email_shell(
        'Payment received',
        '<p>A PayHere payment was received.</p>
        <p><strong>Amount:</strong> ' . $amount . '</p>' .
        booking_details_html($booking)
    );

    send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        ADMIN_EMAIL,
        $subjectAdmin,
        $bodyAdmin,
        'admin_payment_received'
    );

    update_booking_email_status($pdo, (int) $booking['id'], $sentCustomer ? 'Sent' : 'Failed');
}

function send_payment_failed_email(PDO $pdo, array $booking): void
{
    $subject = 'Payment failed - Jebal Guest House #' . $booking['id'];

    $body = email_shell(
        'Payment failed',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your payment could not be completed. Please try again or contact Jebal Guest House.</p>' .
        booking_details_html($booking)
    );

    $sent = send_tracked_email(
        $pdo,
        'booking',
        (int) $booking['id'],
        $booking['email'],
        $subject,
        $body,
        'payment_failed'
    );

    update_booking_email_status($pdo, (int) $booking['id'], $sent ? 'Sent' : 'Failed');
}



function status_label_for_email(?string $status): string
{
    $value = strtolower(trim((string) $status));
    $value = preg_replace('/^payment\s+/', '', $value) ?? $value;
    $value = str_replace(['_', '-'], ' ', $value);
    $value = preg_replace('/\s+/', ' ', $value) ?? $value;
    return $value === '' ? '-' : ucwords($value);
}

function send_booking_status_changed_email(PDO $pdo, array $booking, string $oldStatus, string $newStatus): void
{
    $label = status_label_for_email($newStatus);
    $subject = 'Booking status updated - Jebal Guest House #' . $booking['id'];
    $body = email_shell(
        'Booking status updated',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your booking status has been updated to <strong>' . email_safe($label) . '</strong>.</p>' .
        booking_details_html($booking)
    );

    $sent = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subject, $body, 'booking_status_updated');
    update_booking_email_status($pdo, (int) $booking['id'], $sent ? 'Sent' : 'Failed');
}

function send_payment_status_changed_email(PDO $pdo, array $booking, array $payment, string $oldStatus, string $newStatus): void
{
    $label = status_label_for_email($newStatus);
    $amount = email_safe(format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0)));
    $subject = 'Payment status updated - Jebal Guest House #' . $booking['id'];
    $body = email_shell(
        'Payment status updated',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your payment status has been updated to <strong>' . email_safe($label) . '</strong>.</p>
        <p><strong>Amount:</strong> ' . $amount . '</p>' .
        booking_details_html($booking)
    );

    $sent = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subject, $body, 'payment_status_updated');
    update_booking_email_status($pdo, (int) $booking['id'], $sent ? 'Sent' : 'Failed');
}

function send_combined_status_changed_email(PDO $pdo, array $booking, array $payment, string $oldBookingStatus, string $newBookingStatus, string $oldPaymentStatus, string $newPaymentStatus): void
{
    $bookingLabel = status_label_for_email($newBookingStatus);
    $paymentLabel = status_label_for_email($newPaymentStatus);
    $amount = email_safe(format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0)));
    $subject = 'Booking and payment updated - Jebal Guest House #' . $booking['id'];
    $body = email_shell(
        'Booking and payment updated',
        '<p>Dear ' . email_safe($booking['full_name'] ?? '') . ',</p>
        <p>Your booking and payment details have been updated.</p>
        <ul>
            <li><strong>Booking status:</strong> ' . email_safe($bookingLabel) . '</li>
            <li><strong>Payment status:</strong> ' . email_safe($paymentLabel) . '</li>
            <li><strong>Amount:</strong> ' . $amount . '</li>
        </ul>' .
        booking_details_html($booking)
    );

    $sent = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subject, $body, 'combined_status_updated');
    update_booking_email_status($pdo, (int) $booking['id'], $sent ? 'Sent' : 'Failed');
}

function send_contact_enquiry_emails(PDO $pdo, int $enquiryId, string $name, string $email, string $phone, string $subject, string $message): void
{
    $adminBody = email_shell(
        'New contact enquiry',
        '<p><strong>Name:</strong> ' . email_safe($name) . '</p>
        <p><strong>Email:</strong> ' . email_safe($email) . '</p>
        <p><strong>Phone:</strong> ' . email_safe($phone) . '</p>
        <p><strong>Subject:</strong> ' . email_safe($subject) . '</p>
        <p><strong>Message:</strong><br>' . nl2br(email_safe($message)) . '</p>'
    );

    send_tracked_email(
        $pdo,
        'enquiry',
        $enquiryId,
        ADMIN_EMAIL,
        'New contact enquiry - Jebal Guest House #' . $enquiryId,
        $adminBody,
        'admin_contact_enquiry',
        $email
    );

    $customerBody = email_shell(
        'We received your message',
        '<p>Dear ' . email_safe($name) . ',</p>
        <p>Thank you for contacting Jebal Guest House. We received your message and will reply as soon as possible.</p>'
    );

    send_tracked_email(
        $pdo,
        'enquiry',
        $enquiryId,
        $email,
        'We received your message - Jebal Guest House',
        $customerBody,
        'contact_auto_reply'
    );
}