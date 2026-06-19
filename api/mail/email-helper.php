<?php
/**
 * Email automation helper for Jebal Homes.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers.php';

function send_html_email(string $to, string $subject, string $htmlBody, ?string $replyTo = null): bool
{
    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>';

    if ($replyTo) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    return mail($to, $subject, $htmlBody, implode("\r\n", $headers));
}

function track_email(PDO $pdo, string $relatedType, ?int $relatedId, string $to, string $subject, string $emailType, bool $sent, ?string $errorMessage = null): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO email_logs (related_type, related_id, recipient_email, subject, email_type, status, error_message, sent_at)
         VALUES (:related_type, :related_id, :recipient_email, :subject, :email_type, :status, :error_message, :sent_at)'
    );

    $stmt->execute([
        ':related_type' => $relatedType,
        ':related_id' => $relatedId,
        ':recipient_email' => $to,
        ':subject' => $subject,
        ':email_type' => $emailType,
        ':status' => $sent ? 'Sent' : 'Failed',
        ':error_message' => $errorMessage,
        ':sent_at' => $sent ? date('Y-m-d H:i:s') : null,
    ]);
}

function send_tracked_email(PDO $pdo, string $relatedType, ?int $relatedId, string $to, string $subject, string $htmlBody, string $emailType, ?string $replyTo = null): bool
{
    $sent = send_html_email($to, $subject, $htmlBody, $replyTo);
    track_email($pdo, $relatedType, $relatedId, $to, $subject, $emailType, $sent, $sent ? null : 'mail() returned false');
    return $sent;
}

function booking_details_html(array $booking): string
{
    return '
        <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;">
            <tr><td><strong>Booking ID</strong></td><td>#' . email_safe((string) $booking['id']) . '</td></tr>
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
            <p style="margin-top:24px;color:#475569;">Regards,<br><strong>Jebal Homes</strong></p>
        </div>
    </div>';
}

function send_booking_received_emails(PDO $pdo, array $booking): void
{
    $subjectCustomer = 'Booking inquiry received - Jebal Homes #' . $booking['id'];
    $bodyCustomer = email_shell('Booking inquiry received', '<p>Dear ' . email_safe($booking['full_name']) . ',</p><p>We received your booking inquiry. We will review it and contact you if any details are required.</p>' . booking_details_html($booking));
    $sentCustomer = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subjectCustomer, $bodyCustomer, 'booking_inquiry_received');

    $subjectAdmin = 'New booking received - Jebal Homes #' . $booking['id'];
    $bodyAdmin = email_shell('New booking received', '<p>A new booking inquiry has been submitted.</p>' . booking_details_html($booking));
    send_tracked_email($pdo, 'booking', (int) $booking['id'], ADMIN_EMAIL, $subjectAdmin, $bodyAdmin, 'admin_new_booking', $booking['email']);

    $stmt = $pdo->prepare('UPDATE bookings SET booking_email_status = :status WHERE id = :id');
    $stmt->execute([':status' => $sentCustomer ? 'Sent' : 'Failed', ':id' => $booking['id']]);
}

function send_booking_confirmed_email(PDO $pdo, array $booking): void
{
    $invoiceLink = !empty($booking['invoice_number']) ? '<p><a href="' . email_safe(INVOICE_PUBLIC_BASE_URL . '?id=' . (int) $booking['id']) . '">Download your invoice</a></p>' : '';
    $subject = 'Booking confirmed - Jebal Homes #' . $booking['id'];
    $body = email_shell('Booking confirmed', '<p>Dear ' . email_safe($booking['full_name']) . ',</p><p>Your booking has been confirmed.</p>' . booking_details_html($booking) . $invoiceLink);
    $sent = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subject, $body, 'booking_confirmed');

    $stmt = $pdo->prepare('UPDATE bookings SET booking_email_status = :status WHERE id = :id');
    $stmt->execute([':status' => $sent ? 'Sent' : 'Failed', ':id' => $booking['id']]);
}

function send_booking_cancelled_emails(PDO $pdo, array $booking): void
{
    $subjectCustomer = 'Booking cancelled - Jebal Homes #' . $booking['id'];
    $bodyCustomer = email_shell('Booking cancelled', '<p>Dear ' . email_safe($booking['full_name']) . ',</p><p>Your booking has been cancelled. Contact us if this was unexpected.</p>' . booking_details_html($booking));
    $sentCustomer = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subjectCustomer, $bodyCustomer, 'booking_cancelled');

    $subjectAdmin = 'Booking cancelled - Jebal Homes #' . $booking['id'];
    $bodyAdmin = email_shell('Booking cancelled', '<p>A booking was cancelled.</p>' . booking_details_html($booking));
    send_tracked_email($pdo, 'booking', (int) $booking['id'], ADMIN_EMAIL, $subjectAdmin, $bodyAdmin, 'admin_booking_cancelled');

    $stmt = $pdo->prepare('UPDATE bookings SET cancellation_email_status = :status WHERE id = :id');
    $stmt->execute([':status' => $sentCustomer ? 'Sent' : 'Failed', ':id' => $booking['id']]);
}

function send_payment_success_emails(PDO $pdo, array $booking, array $payment): void
{
    $invoiceLink = INVOICE_PUBLIC_BASE_URL . '?id=' . (int) $booking['id'];
    $amount = email_safe(($payment['currency'] ?? PAYMENT_CURRENCY) . ' ' . format_money_amount((float) ($payment['amount'] ?? 0)));

    $subjectCustomer = 'Payment successful - Jebal Homes #' . $booking['id'];
    $bodyCustomer = email_shell('Payment successful', '<p>Dear ' . email_safe($booking['full_name']) . ',</p><p>Your PayHere payment was successful.</p><p><strong>Amount Paid:</strong> ' . $amount . '</p><p><a href="' . email_safe($invoiceLink) . '">Download your invoice</a></p>' . booking_details_html($booking));
    $sentCustomer = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subjectCustomer, $bodyCustomer, 'payment_successful');

    $subjectAdmin = 'Payment received - Jebal Homes #' . $booking['id'];
    $bodyAdmin = email_shell('Payment received', '<p>A PayHere payment was received.</p><p><strong>Amount:</strong> ' . $amount . '</p>' . booking_details_html($booking));
    send_tracked_email($pdo, 'booking', (int) $booking['id'], ADMIN_EMAIL, $subjectAdmin, $bodyAdmin, 'admin_payment_received');

    $stmt = $pdo->prepare('UPDATE bookings SET payment_email_status = :status WHERE id = :id');
    $stmt->execute([':status' => $sentCustomer ? 'Sent' : 'Failed', ':id' => $booking['id']]);
}

function send_payment_failed_email(PDO $pdo, array $booking): void
{
    $subject = 'Payment failed - Jebal Homes #' . $booking['id'];
    $body = email_shell('Payment failed', '<p>Dear ' . email_safe($booking['full_name']) . ',</p><p>Your payment could not be completed. Please try again or contact Jebal Homes.</p>' . booking_details_html($booking));
    $sent = send_tracked_email($pdo, 'booking', (int) $booking['id'], $booking['email'], $subject, $body, 'payment_failed');

    $stmt = $pdo->prepare('UPDATE bookings SET payment_email_status = :status WHERE id = :id');
    $stmt->execute([':status' => $sent ? 'Sent' : 'Failed', ':id' => $booking['id']]);
}

function send_contact_enquiry_emails(PDO $pdo, int $enquiryId, string $name, string $email, string $phone, string $subject, string $message): void
{
    $adminBody = email_shell('New contact enquiry', '<p><strong>Name:</strong> ' . email_safe($name) . '</p><p><strong>Email:</strong> ' . email_safe($email) . '</p><p><strong>Phone:</strong> ' . email_safe($phone) . '</p><p><strong>Subject:</strong> ' . email_safe($subject) . '</p><p><strong>Message:</strong><br>' . nl2br(email_safe($message)) . '</p>');
    $adminSent = send_tracked_email($pdo, 'enquiry', $enquiryId, ADMIN_EMAIL, 'New contact enquiry - Jebal Homes #' . $enquiryId, $adminBody, 'admin_contact_enquiry', $email);

    $customerBody = email_shell('We received your message', '<p>Dear ' . email_safe($name) . ',</p><p>Thank you for contacting Jebal Homes. We received your message and will reply as soon as possible.</p>');
    $customerSent = send_tracked_email($pdo, 'enquiry', $enquiryId, $email, 'We received your message - Jebal Homes', $customerBody, 'contact_auto_reply');

    $stmt = $pdo->prepare('UPDATE enquiries SET admin_email_status = :admin_status, customer_email_status = :customer_status WHERE id = :id');
    $stmt->execute([
        ':admin_status' => $adminSent ? 'Sent' : 'Failed',
        ':customer_status' => $customerSent ? 'Sent' : 'Failed',
        ':id' => $enquiryId,
    ]);
}
