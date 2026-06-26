<?php
/**
 * Premium HTML email automation helper for Jebal Guest House.
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

        if (str_contains($htmlBody, 'cid:jebal-brand-logo')) {
            $logoPath = email_logo_path();
            if ($logoPath !== '') {
                $mail->addEmbeddedImage($logoPath, 'jebal-brand-logo', basename($logoPath), 'base64', email_image_mime_type($logoPath));
            }
        }

        if (str_contains($htmlBody, 'cid:complyx-brand-logo')) {
            $companyLogoPath = email_company_logo_path();
            if ($companyLogoPath !== '') {
                $mail->addEmbeddedImage($companyLogoPath, 'complyx-brand-logo', basename($companyLogoPath), 'base64', email_image_mime_type($companyLogoPath));
            }
        }

        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = html_to_plain_text($htmlBody);

        return $mail->send();
    } catch (Throwable $e) {
        error_log('PHPMailer HTML send failed: ' . $e->getMessage());
        return false;
    }
}

function html_to_plain_text(string $html): string
{
    $text = preg_replace('/<br\s*\/?>/i', "\n", $html) ?? $html;
    $text = preg_replace('/<\/p>/i', "\n\n", $text) ?? $text;
    $text = preg_replace('/<\/tr>/i', "\n", $text) ?? $text;
    $text = preg_replace('/<\/td>/i', "  ", $text) ?? $text;
    $text = strip_tags($text);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;
    return trim($text);
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

function email_brand_name(): string
{
    return 'Jebal Guest House';
}

function email_public_url(): string
{
    if (defined('APP_BASE_URL') && trim((string) APP_BASE_URL) !== '') {
        return rtrim((string) APP_BASE_URL, '/');
    }

    if (defined('PUBLIC_WEBSITE_URL') && trim((string) PUBLIC_WEBSITE_URL) !== '') {
        return rtrim((string) PUBLIC_WEBSITE_URL, '/');
    }

    if (defined('FRONTEND_BASE_URL') && trim((string) FRONTEND_BASE_URL) !== '') {
        return rtrim((string) FRONTEND_BASE_URL, '/');
    }

    return 'http://localhost/HotelWebsite';
}

function email_asset_file(array $relativePaths): string
{
    $projectRoot = dirname(__DIR__, 2);

    foreach ($relativePaths as $relativePath) {
        $path = $projectRoot . '/' . ltrim($relativePath, '/');
        if (is_file($path)) {
            return $path;
        }
    }

    return '';
}

function email_logo_path(): string
{
    return email_asset_file([
        'assets/logo.jpeg',
        'assets/logo.jpg',
        'assets/logo.png',
        'assets/logo.webp',
        'public-website/src/assets/logo.jpeg',
        'public-website/src/assets/logo.jpg',
        'public-website/src/assets/logo.png',
        'public-website/src/assets/logo.webp',
    ]);
}

function email_company_logo_path(): string
{
    return email_asset_file([
        'assets/company_logo.png',
        'assets/company_logo.jpg',
        'assets/company_logo.jpeg',
        'assets/company_logo.webp',
        'assets/complyx.png',
        'assets/complyx.jpg',
        'assets/complyx.jpeg',
        'assets/complyx.webp',
    ]);
}

function email_image_mime_type(string $path): string
{
    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    return match ($extension) {
        'jpg', 'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        default => 'image/png',
    };
}

function email_logo_url(): string
{
    $localLogo = email_logo_path();

    if ($localLogo !== '') {
        return 'cid:jebal-brand-logo';
    }

    return email_public_url() . '/assets/logo.jpeg';
}

function email_company_logo_url(): string
{
    $localLogo = email_company_logo_path();

    if ($localLogo !== '') {
        return 'cid:complyx-brand-logo';
    }

    return '';
}

function email_button(string $label, string $url): string
{
    if ($url === '') {
        return '';
    }

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;">
        <tr>
            <td style="border-radius:10px;background:#27459f;box-shadow:0 10px 18px rgba(39,69,159,.18);">
                <a href="' . email_safe($url) . '" style="display:inline-block;padding:12px 22px;border-radius:10px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:.02em;">' . email_safe($label) . '</a>
            </td>
        </tr>
    </table>';
}

function email_badge(string $text, string $tone = 'gold'): string
{
    $styles = [
        'gold' => 'background:#fff3cf;color:#a66000;border:1px solid #ffe4a3;',
        'green' => 'background:#dcfce7;color:#05803c;border:1px solid #bbf7d0;',
        'red' => 'background:#fee2e2;color:#e11d48;border:1px solid #fecaca;',
        'blue' => 'background:#e8efff;color:#27459f;border:1px solid #c7d7ff;',
        'gray' => 'background:#f4f7fb;color:#526179;border:1px solid #dfe7f2;',
    ];

    return '<span style="display:inline-block;border-radius:999px;padding:7px 14px;font-size:12px;font-weight:800;letter-spacing:.03em;' . ($styles[$tone] ?? $styles['gold']) . '">' . email_safe($text) . '</span>';
}

function email_shell(string $title, string $content, string $preheader = ''): string
{
    $brand = email_brand_name();
    $year = date('Y');
    $logoUrl = email_logo_url();
    $companyLogoUrl = email_company_logo_url();
    $companyLogoHtml = $companyLogoUrl !== ''
        ? '<img src="' . email_safe($companyLogoUrl) . '" width="56" height="56" alt="CompylX" style="display:block;width:56px;height:56px;object-fit:contain;border:0;margin:10px auto 0;">'
        : '';
    $generatedAt = date('Y-m-d h:i A');
    $preheaderHtml = $preheader !== ''
        ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . email_safe($preheader) . '</div>'
        : '';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>' . email_safe($title) . '</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
' . $preheaderHtml . '
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eef2f7;margin:0;padding:28px 14px;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:760px;border-collapse:separate;border-spacing:0;">
<tr>
<td style="background:#27459f;border-radius:18px 18px 0 0;padding:28px 30px;color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="vertical-align:middle;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="width:58px;height:58px;border-radius:14px;background:#ffffff1f;vertical-align:middle;text-align:center;overflow:hidden;">
<img src="' . email_safe($logoUrl) . '" width="58" height="58" alt="logo" style="display:block;width:58px;height:58px;object-fit:contain;border:0;outline:none;text-decoration:none;background:#ffffff1f;">
</td>
<td style="padding-left:14px;vertical-align:middle;">
<div style="font-size:24px;line-height:1.15;color:#ffffff;font-weight:800;letter-spacing:.01em;">' . email_safe($brand) . '</div>
<div style="margin-top:8px;font-size:12px;color:#dbe6ff;line-height:1.4;">Jaffna, Sri Lanka &nbsp;&bull;&nbsp; Comfortable Guest House</div>
</td>
</tr>
</table>
</td>
<td align="right" style="vertical-align:middle;color:#ffffff;">
<div style="font-size:13px;line-height:1.6;color:#eef4ff;">Generated: ' . email_safe($generatedAt) . '</div>
<div style="margin-top:4px;font-size:13px;line-height:1.6;color:#eef4ff;font-weight:700;">' . email_safe($title) . '</div>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background:#ffffff;border-left:1px solid #dfe7f2;border-right:1px solid #dfe7f2;padding:26px 30px 30px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#102a7a;font-weight:800;">' . email_safe($title) . '</h1>
<div style="font-size:15px;line-height:1.7;color:#243145;">' . $content . '</div>
</td>
</tr>
<tr>
<td style="background:#f8fafc;border:1px solid #dfe7f2;border-top:0;border-radius:0 0 18px 18px;padding:20px 30px;">
<p style="margin:0 0 18px;color:#526179;font-size:13px;line-height:1.6;text-align:left;"><strong style="color:#102a7a;">Notes:</strong> Keep this email for your records. For booking or billing queries, contact the guest house directly.</p>
<div style="text-align:center;">
<p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">&copy; ' . $year . ' ' . email_safe($brand) . '. All rights reserved.</p>
<div style="margin-top:12px;text-align:center;color:#64748b;font-size:12px;line-height:1.5;">
<div style="font-size:12px;color:#64748b;">powered by</div>
' . $companyLogoHtml . '
</div>
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>';
}

function email_info_table(array $rows): string
{
    $html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;border-collapse:separate;border-spacing:0 10px;">';

    foreach ($rows as $label => $value) {
        if ($value === null || $value === '') {
            continue;
        }

        $html .= '<tr>
            <td style="width:38%;padding:13px 16px;background:#f8fafc;border:1px solid #dfe7f2;border-right:0;border-radius:12px 0 0 12px;color:#64748b;font-size:13px;font-weight:700;">' . email_safe((string) $label) . '</td>
            <td style="padding:13px 16px;background:#ffffff;border:1px solid #dfe7f2;border-left:0;border-radius:0 12px 12px 0;color:#0f172a;font-size:14px;font-weight:800;">' . email_safe((string) $value) . '</td>
        </tr>';
    }

    return $html . '</table>';
}

function booking_guest_name(array $booking): string
{
    $isOther = !empty($booking['is_booking_for_other']);
    $stayingGuest = trim((string) ($booking['staying_guest_name'] ?? ''));

    if ($isOther && $stayingGuest !== '') {
        return $stayingGuest;
    }

    return trim((string) ($booking['full_name'] ?? $booking['guest_name'] ?? 'Guest'));
}

function booking_details_html(array $booking): string
{
    $bookingNo = $booking['booking_no'] ?? ('BK-' . str_pad((string) ($booking['id'] ?? ''), 5, '0', STR_PAD_LEFT));
    $isOther = !empty($booking['is_booking_for_other']);

    $rows = [
        'Booking No' => $bookingNo,
        'Booked By' => $booking['full_name'] ?? $booking['guest_name'] ?? '',
        'Staying Guest' => $isOther ? booking_guest_name($booking) : null,
        'Room' => $booking['room_name'] ?? '',
        'Check-in' => $booking['check_in_date'] ?? '',
        'Check-out' => $booking['check_out_date'] ?? '',
        'Guests' => (string) ($booking['guests'] ?? ''),
        'Amount' => isset($booking['amount']) ? format_money_amount((float) $booking['amount']) : '',
        'Booking Status' => status_label_for_email($booking['status'] ?? $booking['booking_status'] ?? ''),
        'Payment Status' => status_label_for_email($booking['payment_status'] ?? ''),
        'Guest Phone' => $isOther ? ($booking['staying_guest_phone'] ?? '') : ($booking['phone'] ?? ''),
        'Guest Email' => $isOther ? ($booking['staying_guest_email'] ?? '') : ($booking['email'] ?? ''),
    ];

    if ($isOther && !empty($booking['staying_guest_note'])) {
        $rows['Guest Note'] = $booking['staying_guest_note'];
    }

    return email_info_table($rows);
}

function contact_details_html(string $name, string $email, string $phone, string $subject, string $message): string
{
    return email_info_table([
        'Name' => $name,
        'Email' => $email,
        'Phone' => $phone,
        'Subject' => $subject,
        'Message' => $message,
    ]);
}

function otp_email_html(string $title, string $otp, int $validMinutes = 1): string
{
    $content = '<p style="margin:0 0 16px;">Use the verification code below to continue. This code expires in <strong>' . (int) $validMinutes . ' minute' . ($validMinutes === 1 ? '' : 's') . '</strong>.</p>
    <div style="margin:22px 0;padding:22px;border-radius:18px;background:#111827;text-align:center;">
        <div style="color:#d4b896;font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;">Verification Code</div>
        <div style="margin-top:10px;color:#ffffff;font-size:36px;letter-spacing:.22em;font-weight:800;">' . email_safe($otp) . '</div>
    </div>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px;">If you did not request this code, ignore this email and keep your admin password private.</p>';

    return email_shell($title, $content, 'Your Jebal Guest House verification code is ' . $otp);
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
    $bookingId = (int) ($booking['id'] ?? 0);
    $subjectCustomer = 'Booking inquiry received - Jebal Guest House #' . $bookingId;

    $bodyCustomer = email_shell(
        'Booking inquiry received',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">We received your booking inquiry. Please complete the payment step if required. Our team will contact you if any detail needs confirmation.</p>' .
        email_badge('Payment pending', 'gold') .
        booking_details_html($booking) .
        email_button('View Rooms', email_public_url() . '/rooms'),
        'We received your booking inquiry at Jebal Guest House.'
    );

    $sentCustomer = send_tracked_email(
        $pdo,
        'booking',
        $bookingId,
        (string) ($booking['email'] ?? ''),
        $subjectCustomer,
        $bodyCustomer,
        'booking_inquiry_received'
    );

    $subjectAdmin = 'New booking received - Jebal Guest House #' . $bookingId;

    $bodyAdmin = email_shell(
        'New booking received',
        '<p style="margin:0 0 16px;">A new booking inquiry has been submitted from the website.</p>' .
        email_badge('Admin action required', 'blue') .
        booking_details_html($booking),
        'A new booking inquiry has been submitted.'
    );

    send_tracked_email(
        $pdo,
        'booking',
        $bookingId,
        ADMIN_EMAIL,
        $subjectAdmin,
        $bodyAdmin,
        'admin_new_booking',
        $booking['email'] ?? null
    );

    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
    }
}

function send_booking_confirmed_email(PDO $pdo, array $booking): void
{
    $invoiceLink = '';
    $downloadLink = invoice_download_link($booking);

    if (!empty($booking['invoice_number']) && $downloadLink !== '') {
        $invoiceLink = email_button('Download Invoice', $downloadLink);
    }

    $bookingId = (int) ($booking['id'] ?? 0);
    $subject = 'Booking confirmed - Jebal Guest House #' . $bookingId;

    $body = email_shell(
        'Booking confirmed',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your booking has been confirmed. Please keep this email for check-in reference.</p>' .
        email_badge('Confirmed', 'green') .
        booking_details_html($booking) .
        $invoiceLink,
        'Your Jebal Guest House booking has been confirmed.'
    );

    $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), $subject, $body, 'booking_confirmed');
    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }
}

function send_booking_cancelled_emails(PDO $pdo, array $booking): void
{
    $bookingId = (int) ($booking['id'] ?? 0);
    $subjectCustomer = 'Booking cancelled - Jebal Guest House #' . $bookingId;

    $bodyCustomer = email_shell(
        'Booking cancelled',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your booking has been cancelled. Contact us if this was unexpected or if you need help making a new booking.</p>' .
        email_badge('Cancelled', 'red') .
        booking_details_html($booking),
        'Your Jebal Guest House booking has been cancelled.'
    );

    $sentCustomer = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), $subjectCustomer, $bodyCustomer, 'booking_cancelled');

    $bodyAdmin = email_shell(
        'Booking cancelled',
        '<p style="margin:0 0 16px;">A booking was cancelled.</p>' . email_badge('Cancelled', 'red') . booking_details_html($booking),
        'A booking was cancelled.'
    );

    send_tracked_email($pdo, 'booking', $bookingId, ADMIN_EMAIL, 'Booking cancelled - Jebal Guest House #' . $bookingId, $bodyAdmin, 'admin_booking_cancelled');

    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
    }
}

function send_payment_success_emails(PDO $pdo, array $booking, array $payment): void
{
    $downloadLink = invoice_download_link($booking);
    $invoiceLink = $downloadLink !== '' ? email_button('Download Invoice', $downloadLink) : '';
    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $bookingId = (int) ($booking['id'] ?? 0);

    $bodyCustomer = email_shell(
        'Payment successful',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your payment has been received successfully.</p>' .
        email_badge('Paid', 'green') .
        email_info_table([
            'Amount Paid' => $amount,
            'Payment Method' => $payment['payment_method'] ?? $payment['method'] ?? 'PayHere',
            'Transaction ID' => $payment['transaction_id'] ?? $payment['payment_id'] ?? '',
        ]) .
        booking_details_html($booking) .
        $invoiceLink,
        'Your payment to Jebal Guest House was successful.'
    );

    $sentCustomer = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment successful - Jebal Guest House #' . $bookingId, $bodyCustomer, 'payment_successful');

    $bodyAdmin = email_shell(
        'Payment received',
        '<p style="margin:0 0 16px;">A payment was received.</p>' .
        email_badge('Paid', 'green') .
        email_info_table(['Amount' => $amount]) .
        booking_details_html($booking),
        'A payment was received.'
    );

    send_tracked_email($pdo, 'booking', $bookingId, ADMIN_EMAIL, 'Payment received - Jebal Guest House #' . $bookingId, $bodyAdmin, 'admin_payment_received');

    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
    }
}

function send_payment_failed_email(PDO $pdo, array $booking): void
{
    $bookingId = (int) ($booking['id'] ?? 0);
    $body = email_shell(
        'Payment failed',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your payment could not be completed. Please try again or contact Jebal Guest House for help.</p>' .
        email_badge('Payment failed', 'red') .
        booking_details_html($booking),
        'Your payment could not be completed.'
    );

    $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment failed - Jebal Guest House #' . $bookingId, $body, 'payment_failed');
    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }
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
    $tone = strtolower($label) === 'confirmed' ? 'green' : (strtolower($label) === 'cancelled' ? 'red' : 'blue');
    $bookingId = (int) ($booking['id'] ?? 0);

    $body = email_shell(
        'Booking status updated',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your booking status has been updated.</p>' .
        email_badge($label, $tone) .
        booking_details_html($booking),
        'Your booking status has been updated.'
    );

    $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Booking status updated - Jebal Guest House #' . $bookingId, $body, 'booking_status_updated');
    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }
}

function send_payment_status_changed_email(PDO $pdo, array $booking, array $payment, string $oldStatus, string $newStatus): void
{
    $label = status_label_for_email($newStatus);
    $tone = strtolower($label) === 'paid' ? 'green' : (strtolower($label) === 'failed' ? 'red' : 'gold');
    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $bookingId = (int) ($booking['id'] ?? 0);

    $body = email_shell(
        'Payment status updated',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your payment status has been updated.</p>' .
        email_badge($label, $tone) .
        email_info_table(['Amount' => $amount]) .
        booking_details_html($booking),
        'Your payment status has been updated.'
    );

    $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment status updated - Jebal Guest House #' . $bookingId, $body, 'payment_status_updated');
    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }
}

function send_combined_status_changed_email(PDO $pdo, array $booking, array $payment, string $oldBookingStatus, string $newBookingStatus, string $oldPaymentStatus, string $newPaymentStatus): void
{
    $bookingLabel = status_label_for_email($newBookingStatus);
    $paymentLabel = status_label_for_email($newPaymentStatus);
    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $bookingId = (int) ($booking['id'] ?? 0);

    $body = email_shell(
        'Booking and payment updated',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
        <p style="margin:0 0 16px;">Your booking and payment details have been updated.</p>' .
        email_info_table([
            'Booking Status' => $bookingLabel,
            'Payment Status' => $paymentLabel,
            'Amount' => $amount,
        ]) .
        booking_details_html($booking),
        'Your booking and payment details have been updated.'
    );

    $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Booking and payment updated - Jebal Guest House #' . $bookingId, $body, 'combined_status_updated');
    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }
}

function send_contact_enquiry_emails(PDO $pdo, int $enquiryId, string $name, string $email, string $phone, string $subject, string $message): void
{
    $ref = 'INQ-' . str_pad((string) $enquiryId, 5, '0', STR_PAD_LEFT);

    $adminBody = email_shell(
        'New contact enquiry',
        '<p style="margin:0 0 16px;">A new contact enquiry was submitted from the website.</p>' .
        email_badge($ref, 'blue') .
        contact_details_html($name, $email, $phone, $subject, $message),
        'A new contact enquiry was submitted.'
    );

    send_tracked_email(
        $pdo,
        'enquiry',
        $enquiryId,
        ADMIN_EMAIL,
        'New contact enquiry - Jebal Guest House ' . $ref,
        $adminBody,
        'admin_contact_enquiry',
        $email
    );

    $customerBody = email_shell(
        'We received your message',
        '<p style="margin:0 0 14px;">Dear ' . email_safe($name) . ',</p>
        <p style="margin:0 0 16px;">Thank you for contacting Jebal Guest House. We received your message and will reply as soon as possible.</p>' .
        email_badge($ref, 'gold') .
        email_info_table([
            'Reference' => $ref,
            'Subject' => $subject,
        ]),
        'We received your message at Jebal Guest House.'
    );

    send_tracked_email(
        $pdo,
        'enquiry',
        $enquiryId,
        $email,
        'We received your message - Jebal Guest House ' . $ref,
        $customerBody,
        'contact_auto_reply'
    );
}
