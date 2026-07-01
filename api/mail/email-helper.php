<?php
/**
 * Premium HTML email automation helper for Jebal Guest House.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bookings/booking-audit-helper.php';

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
        // Prevent public/notification requests from hanging for a full PHP timeout when SMTP is slow.
        $mail->Timeout = 30;
        $mail->SMTPKeepAlive = false;
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

function booking_reference(array $booking): string
{
    $bookingNo = trim((string) ($booking['booking_no'] ?? ''));

    if ($bookingNo !== '') {
        return $bookingNo;
    }

    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId > 0) {
        return 'BK-' . str_pad((string) $bookingId, 6, '0', STR_PAD_LEFT);
    }

    return '-';
}

function booking_invoice_number(array $booking): string
{
    foreach (['invoice_number', 'payment_invoice_number', 'invoice_no'] as $key) {
        $value = trim((string) ($booking[$key] ?? ''));

        if ($value !== '') {
            return $value;
        }
    }

    return '';
}

function booking_support_rows(array $booking): array
{
    $rows = [
        'Booking ID' => (string) ((int) ($booking['id'] ?? 0) ?: ''),
        'Booking Reference' => booking_reference($booking),
    ];

    $invoiceNumber = booking_invoice_number($booking);
    if ($invoiceNumber !== '') {
        $rows['Invoice Number'] = $invoiceNumber;
    }

    return $rows;
}

function booking_admin_summary_rows(array $booking, array $payment = []): array
{
    $isOther = !empty($booking['is_booking_for_other']);
    $amount = $payment['amount'] ?? $booking['amount'] ?? null;
    $paymentStatus = $payment['status'] ?? $booking['payment_status'] ?? '';

    return array_merge(booking_support_rows($booking), [
        'Guest Name' => booking_guest_name($booking),
        'Booked By' => $booking['full_name'] ?? $booking['guest_name'] ?? '',
        'Phone Number' => $isOther ? ($booking['staying_guest_phone'] ?? $booking['phone'] ?? '') : ($booking['phone'] ?? ''),
        'Email' => $isOther ? ($booking['staying_guest_email'] ?? $booking['email'] ?? '') : ($booking['email'] ?? ''),
        'Room' => $booking['room_name'] ?? '',
        'Dates' => trim((string) ($booking['check_in_date'] ?? '') . ' to ' . (string) ($booking['check_out_date'] ?? '')),
        'Amount' => $amount !== null && $amount !== '' ? format_money_amount((float) $amount) : '',
        'Payment Status' => status_label_for_email($paymentStatus),
    ]);
}

function booking_details_html(array $booking): string
{
    $isOther = !empty($booking['is_booking_for_other']);

    $rows = array_merge(booking_support_rows($booking), [
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
    ]);

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

function booking_bill_access_token(string $orderId, int $bookingId, string $amount): string
{
    return hash_hmac('sha256', $orderId . '|' . $bookingId . '|' . $amount, PAYHERE_MERCHANT_SECRET);
}

function booking_bill_public_base_url(): string
{
    $publicBaseUrl = defined('FRONTEND_URL') && FRONTEND_URL !== ''
        ? FRONTEND_URL
        : (defined('PUBLIC_APP_URL') && PUBLIC_APP_URL !== '' ? PUBLIC_APP_URL : APP_BASE_URL);

    return rtrim((string) $publicBaseUrl, '/');
}

function latest_booking_bill_url(PDO $pdo, int $bookingId): string
{
    if ($bookingId < 1 || !defined('PAYHERE_MERCHANT_SECRET') || PAYHERE_MERCHANT_SECRET === '') {
        return '';
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT order_id, amount
             FROM payments
             WHERE booking_id = :booking_id
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmt->execute([':booking_id' => $bookingId]);
        $payment = $stmt->fetch();

        if (!$payment || empty($payment['order_id'])) {
            return '';
        }

        $amount = number_format((float) ($payment['amount'] ?? 0), 2, '.', '');
        $token = booking_bill_access_token((string) $payment['order_id'], $bookingId, $amount);

        return booking_bill_public_base_url() . '/booking-bill?' . http_build_query([
            'booking_id' => $bookingId,
            'order_id' => (string) $payment['order_id'],
            'token' => $token,
        ]);
    } catch (Throwable $e) {
        error_log('Unable to build booking bill URL for email: ' . $e->getMessage());
        return '';
    }
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


function booking_email_sent(PDO $pdo, int $bookingId, array $emailTypes): bool
{
    if ($bookingId < 1 || empty($emailTypes)) {
        return false;
    }

    try {
        $placeholders = [];
        $params = [':booking_id' => $bookingId];

        foreach (array_values($emailTypes) as $index => $emailType) {
            $key = ':type_' . $index;
            $placeholders[] = $key;
            $params[$key] = $emailType;
        }

        $sql = 'SELECT COUNT(*) FROM email_logs
                WHERE booking_id = :booking_id
                  AND status = \'Sent\'
                  AND email_type IN (' . implode(',', $placeholders) . ')';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn() > 0;
    } catch (Throwable $e) {
        error_log('Booking email duplicate check failed: ' . $e->getMessage());
        return false;
    }
}

function send_booking_payment_pending_emails_once(PDO $pdo, array $booking, array $payment = []): void
{
    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId < 1) {
        return;
    }

    $paymentStatus = (string) ($booking['payment_status'] ?? $payment['status'] ?? 'Payment Pending');

    if ($paymentStatus !== 'Payment Pending') {
        return;
    }

    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $orderId = trim((string) ($payment['order_id'] ?? $booking['order_id'] ?? ''));
    $billUrl = trim((string) ($payment['bill_url'] ?? ''));
    $billButton = $billUrl !== '' ? email_button('Resume Payment / View Booking Bill', $billUrl) : '';

    $customerType = 'booking_payment_pending_customer';
    $adminType = 'booking_payment_pending_admin';

    if (!booking_email_sent($pdo, $bookingId, [$customerType])) {
        $bodyCustomer = email_shell(
            'Booking received - payment pending',
            '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
            <p style="margin:0 0 16px;">We received your booking details. Your booking is waiting for payment confirmation.</p>' .
            email_badge('Payment pending', 'gold') .
            email_info_table(array_merge(booking_support_rows($booking), [
                'Order ID' => $orderId !== '' ? $orderId : '-',
                'Amount Due' => $amount,
                'Payment Status' => 'Payment Pending',
            ])) .
            booking_details_html($booking) .
            $billButton .
            '<p style="margin:16px 0 0;color:#6b7280;font-size:14px;">This is not a payment confirmation. Your booking will be confirmed only after successful payment.</p>',
            'We received your booking details. Payment is still pending.'
        );

        send_tracked_email(
            $pdo,
            'booking',
            $bookingId,
            (string) ($booking['email'] ?? ''),
            'Booking received - payment pending - Jebal Guest House #' . $bookingId,
            $bodyCustomer,
            $customerType
        );
    }

    if (!booking_email_sent($pdo, $bookingId, [$adminType])) {
        $bodyAdmin = email_shell(
            'New booking received - payment pending',
            '<p style="margin:0 0 16px;">A customer reached the booking bill page. Payment is still pending.</p>' .
            email_badge('Payment pending', 'gold') .
            email_info_table(array_merge(booking_admin_summary_rows($booking, $payment), [
                'Order ID' => $orderId !== '' ? $orderId : '-',
            ])) .
            $billButton,
            'A new booking reached the bill page. Payment is pending.'
        );

        send_tracked_email(
            $pdo,
            'booking',
            $bookingId,
            ADMIN_EMAIL,
            'New booking received - payment pending - Jebal Guest House #' . $bookingId,
            $bodyAdmin,
            $adminType,
            $booking['email'] ?? null
        );
    }

    update_booking_email_status($pdo, $bookingId, 'Payment Pending Email Sent');
    booking_audit_log($pdo, $bookingId, 'pending_email_sent', 'Pending Email Sent', 'Booking pending emails were sent or had already been sent.', [
        'order_id' => $orderId,
    ]);
}


function send_booking_expired_emails_once(PDO $pdo, array $booking): void
{
    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId < 1) {
        return;
    }

    $customerType = 'booking_expired_customer';
    $adminType = 'booking_expired_admin';

    if (!booking_email_sent($pdo, $bookingId, [$customerType])) {
        $bodyCustomer = email_shell(
            'Booking hold expired',
            '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
            <p style="margin:0 0 16px;">Your booking hold expired because payment was not completed within the allowed time.</p>' .
            email_badge('Expired', 'red') .
            email_info_table(booking_support_rows($booking)) .
            booking_details_html($booking) .
            '<p style="margin:16px 0 0;color:#6b7280;font-size:14px;">You can make a new booking if the room is still available.</p>',
            'Your booking hold expired because payment was not completed.'
        );

        send_tracked_email(
            $pdo,
            'booking',
            $bookingId,
            (string) ($booking['email'] ?? ''),
            'Booking hold expired - Jebal Guest House #' . $bookingId,
            $bodyCustomer,
            $customerType
        );
    }

    if (!booking_email_sent($pdo, $bookingId, [$adminType])) {
        $bodyAdmin = email_shell(
            'Pending booking expired',
            '<p style="margin:0 0 16px;">An unpaid booking hold expired and the room was released.</p>' .
            email_badge('Expired', 'red') .
            email_info_table(booking_admin_summary_rows($booking)),
            'An unpaid booking hold expired.'
        );

        send_tracked_email(
            $pdo,
            'booking',
            $bookingId,
            ADMIN_EMAIL,
            'Pending booking expired - Jebal Guest House #' . $bookingId,
            $bodyAdmin,
            $adminType,
            $booking['email'] ?? null
        );
    }

    update_booking_email_status($pdo, $bookingId, 'Expired Email Sent');
    booking_audit_log($pdo, $bookingId, 'expired_email_sent', 'Expired Email Sent', 'Booking expiry emails were sent or had already been sent.', []);
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

    $customerType = 'payment_successful';
    $adminType = 'admin_payment_received';

    if (!booking_email_sent($pdo, $bookingId, [$customerType])) {
        $bodyCustomer = email_shell(
            'Payment successful',
            '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
            <p style="margin:0 0 16px;">Your payment has been received successfully. Your booking is now confirmed.</p>' .
            email_badge('Paid', 'green') .
            email_info_table(array_merge(booking_support_rows($booking), [
                'Amount Paid' => $amount,
                'Payment Method' => $payment['payment_method'] ?? $payment['method'] ?? 'PayHere',
                'Transaction ID' => $payment['transaction_id'] ?? $payment['payment_id'] ?? '',
            ])) .
            booking_details_html($booking) .
            $invoiceLink,
            'Your payment to Jebal Guest House was successful.'
        );

        $sentCustomer = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment successful - Jebal Guest House #' . $bookingId, $bodyCustomer, $customerType);
        if ($bookingId > 0) {
            update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
        }
    }

    if (!booking_email_sent($pdo, $bookingId, [$adminType])) {
        $bodyAdmin = email_shell(
            'Payment received',
            '<p style="margin:0 0 16px;">A customer payment was received and the booking is confirmed.</p>' .
            email_badge('Paid', 'green') .
            email_info_table(array_merge(booking_admin_summary_rows($booking, $payment), [
                'Payment Method' => $payment['payment_method'] ?? $payment['method'] ?? 'PayHere',
                'Transaction ID' => $payment['transaction_id'] ?? $payment['payment_id'] ?? '',
            ])),
            'A payment was received.'
        );

        send_tracked_email($pdo, 'booking', $bookingId, ADMIN_EMAIL, 'Payment received - Jebal Guest House #' . $bookingId, $bodyAdmin, $adminType, $booking['email'] ?? null);
    }
}


function send_payment_failed_email(PDO $pdo, array $booking): void
{
    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId < 1) {
        return;
    }

    if (!booking_email_sent($pdo, $bookingId, ['payment_failed'])) {
        $body = email_shell(
            'Payment failed',
            '<p style="margin:0 0 14px;">Dear ' . email_safe($booking['full_name'] ?? 'Guest') . ',</p>
            <p style="margin:0 0 16px;">Your payment could not be completed. You can retry payment from your booking bill link if the room is still available.</p>' .
            email_badge('Payment failed', 'red') .
            email_info_table(booking_support_rows($booking)) .
            booking_details_html($booking) .
            email_button('Retry Payment', latest_booking_bill_url($pdo, $bookingId)),
            'Your payment could not be completed.'
        );

        $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment failed - Jebal Guest House #' . $bookingId, $body, 'payment_failed');
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }

    if (!booking_email_sent($pdo, $bookingId, ['admin_payment_failed'])) {
        $adminBody = email_shell(
            'Payment failed',
            '<p style="margin:0 0 16px;">A customer payment failed or was cancelled.</p>' .
            email_badge('Payment failed', 'red') .
            email_info_table(booking_admin_summary_rows($booking)),
            'A customer payment failed or was cancelled.'
        );

        send_tracked_email(
            $pdo,
            'booking',
            $bookingId,
            ADMIN_EMAIL,
            'Payment failed - Jebal Guest House #' . $bookingId,
            $adminBody,
            'admin_payment_failed',
            $booking['email'] ?? null
        );
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

function contact_email_already_sent(PDO $pdo, int $enquiryId, string $emailType): bool
{
    if ($enquiryId < 1 || $emailType === '') {
        return false;
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM email_logs
             WHERE enquiry_id = :enquiry_id
               AND email_type = :email_type
               AND status = \'Sent\''
        );
        $stmt->execute([
            ':enquiry_id' => $enquiryId,
            ':email_type' => $emailType,
        ]);

        return (int) $stmt->fetchColumn() > 0;
    } catch (Throwable $e) {
        error_log('Contact email duplicate check failed: ' . $e->getMessage());
        return false;
    }
}

function send_contact_enquiry_emails(PDO $pdo, int $enquiryId, string $name, string $email, string $phone, string $subject, string $message): void
{
    $ref = 'INQ-' . str_pad((string) $enquiryId, 5, '0', STR_PAD_LEFT);
    $adminEmail = defined('ADMIN_EMAIL') ? trim((string) ADMIN_EMAIL) : '';

    if ($adminEmail !== '' && filter_var($adminEmail, FILTER_VALIDATE_EMAIL) && !contact_email_already_sent($pdo, $enquiryId, 'admin_contact_enquiry')) {
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
            $adminEmail,
            'New contact enquiry - Jebal Guest House ' . $ref,
            $adminBody,
            'admin_contact_enquiry',
            $email
        );
    } elseif ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        error_log('ADMIN_EMAIL is missing or invalid. Contact admin email not sent for enquiry #' . $enquiryId);
    }

    if (filter_var($email, FILTER_VALIDATE_EMAIL) && !contact_email_already_sent($pdo, $enquiryId, 'contact_auto_reply')) {
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
}


/**
 * Ensure the async email queue table exists.
 * This keeps the contact form fix deployable even when the SQL was not imported manually.
 */
function email_queue_column_exists(PDO $pdo, string $column): bool
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'email_queue'
           AND COLUMN_NAME = :column"
    );
    $stmt->execute([':column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}

function email_queue_index_exists(PDO $pdo, string $indexName): bool
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'email_queue'
           AND INDEX_NAME = :index_name"
    );
    $stmt->execute([':index_name' => $indexName]);
    return (int) $stmt->fetchColumn() > 0;
}

function email_queue_add_column_if_missing(PDO $pdo, string $column, string $definition): void
{
    if (!email_queue_column_exists($pdo, $column)) {
        $pdo->exec("ALTER TABLE email_queue ADD COLUMN {$definition}");
    }
}

/**
 * Ensure the async email queue table exists and upgrade older queue schemas.
 * Your current DB already had email_queue, but it was missing locked_at/body_html/etc.
 * CREATE TABLE IF NOT EXISTS alone does NOT update existing tables, so the worker failed.
 */
function ensure_email_queue_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS email_queue (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            related_type VARCHAR(40) NULL,
            related_id INT UNSIGNED NULL,
            recipient_email VARCHAR(190) NOT NULL,
            reply_to_email VARCHAR(190) NULL,
            subject VARCHAR(255) NOT NULL,
            body_html MEDIUMTEXT NULL,
            email_type VARCHAR(80) NOT NULL,
            status ENUM('pending','processing','sent','failed','Pending','Processing','Sent','Failed') NOT NULL DEFAULT 'pending',
            attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
            max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 3,
            last_error TEXT NULL,
            available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            locked_at DATETIME NULL,
            sent_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_email_queue_job (related_type, related_id, email_type, recipient_email),
            KEY idx_email_queue_status_available (status, available_at, id),
            KEY idx_email_queue_related (related_type, related_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // Upgrade older versions of the table without deleting existing queued emails.
    email_queue_add_column_if_missing($pdo, 'related_type', "related_type VARCHAR(40) NULL AFTER id");
    email_queue_add_column_if_missing($pdo, 'related_id', "related_id INT UNSIGNED NULL AFTER related_type");
    email_queue_add_column_if_missing($pdo, 'recipient_email', "recipient_email VARCHAR(190) NOT NULL AFTER related_id");
    email_queue_add_column_if_missing($pdo, 'reply_to_email', "reply_to_email VARCHAR(190) NULL AFTER recipient_email");
    email_queue_add_column_if_missing($pdo, 'subject', "subject VARCHAR(255) NOT NULL AFTER reply_to_email");
    email_queue_add_column_if_missing($pdo, 'body_html', "body_html MEDIUMTEXT NULL AFTER subject");
    email_queue_add_column_if_missing($pdo, 'email_type', "email_type VARCHAR(80) NOT NULL DEFAULT 'general' AFTER body_html");
    email_queue_add_column_if_missing($pdo, 'status', "status ENUM('pending','processing','sent','failed','Pending','Processing','Sent','Failed') NOT NULL DEFAULT 'pending' AFTER email_type");
    email_queue_add_column_if_missing($pdo, 'attempts', "attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER status");
    email_queue_add_column_if_missing($pdo, 'max_attempts', "max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 3 AFTER attempts");
    email_queue_add_column_if_missing($pdo, 'last_error', "last_error TEXT NULL AFTER max_attempts");
    email_queue_add_column_if_missing($pdo, 'available_at', "available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER last_error");
    email_queue_add_column_if_missing($pdo, 'locked_at', "locked_at DATETIME NULL AFTER available_at");
    email_queue_add_column_if_missing($pdo, 'sent_at', "sent_at DATETIME NULL AFTER locked_at");
    email_queue_add_column_if_missing($pdo, 'created_at', "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER sent_at");
    email_queue_add_column_if_missing($pdo, 'updated_at', "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

    if (!email_queue_index_exists($pdo, 'idx_email_queue_status_available')) {
        $pdo->exec("CREATE INDEX idx_email_queue_status_available ON email_queue (status, available_at, id)");
    }

    if (!email_queue_index_exists($pdo, 'idx_email_queue_related')) {
        $pdo->exec("CREATE INDEX idx_email_queue_related ON email_queue (related_type, related_id)");
    }
}

function enqueue_email(
    PDO $pdo,
    ?string $relatedType,
    ?int $relatedId,
    string $to,
    string $subject,
    string $htmlBody,
    string $emailType,
    ?string $replyTo = null,
    int $maxAttempts = 3
): bool {
    ensure_email_queue_table($pdo);

    $to = trim($to);
    $replyTo = $replyTo !== null ? trim($replyTo) : null;

    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        error_log('Email queue skipped invalid recipient: ' . $to);
        return false;
    }

    if ($replyTo !== null && $replyTo !== '' && !filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $replyTo = null;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO email_queue
            (related_type, related_id, recipient_email, reply_to_email, subject, body_html, email_type, status, attempts, max_attempts, available_at, created_at, updated_at)
         VALUES
            (:related_type, :related_id, :recipient_email, :reply_to_email, :subject, :body_html, :email_type, 'pending', 0, :max_attempts, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            subject = VALUES(subject),
            body_html = VALUES(body_html),
            reply_to_email = VALUES(reply_to_email),
            status = IF(status = 'sent', status, 'pending'),
            last_error = IF(status = 'sent', last_error, NULL),
            available_at = IF(status = 'sent', available_at, NOW()),
            updated_at = NOW()"
    );

    return $stmt->execute([
        ':related_type' => $relatedType,
        ':related_id' => $relatedId,
        ':recipient_email' => $to,
        ':reply_to_email' => $replyTo,
        ':subject' => mb_substr($subject, 0, 255),
        ':body_html' => $htmlBody,
        ':email_type' => $emailType,
        ':max_attempts' => max(1, min(10, $maxAttempts)),
    ]);
}

function queue_contact_enquiry_emails(PDO $pdo, int $enquiryId, string $name, string $email, string $phone, string $subject, string $message): int
{
    $queued = 0;
    $ref = 'INQ-' . str_pad((string) $enquiryId, 5, '0', STR_PAD_LEFT);
    $adminEmail = defined('ADMIN_EMAIL') ? trim((string) ADMIN_EMAIL) : '';

    if ($adminEmail !== '' && filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        $adminBody = email_shell(
            'New contact enquiry',
            '<p style="margin:0 0 16px;">A new contact enquiry was submitted from the website.</p>' .
            email_badge($ref, 'blue') .
            contact_details_html($name, $email, $phone, $subject, $message),
            'A new contact enquiry was submitted.'
        );

        if (enqueue_email(
            $pdo,
            'enquiry',
            $enquiryId,
            $adminEmail,
            'New contact enquiry - Jebal Guest House ' . $ref,
            $adminBody,
            'admin_contact_enquiry',
            $email
        )) {
            $queued++;
        }
    } else {
        error_log('ADMIN_EMAIL is missing or invalid. Contact admin queue skipped for enquiry #' . $enquiryId);
    }

    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
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

        if (enqueue_email(
            $pdo,
            'enquiry',
            $enquiryId,
            $email,
            'We received your message - Jebal Guest House ' . $ref,
            $customerBody,
            'contact_auto_reply'
        )) {
            $queued++;
        }
    }

    return $queued;
}

function lock_next_email_queue_batch(PDO $pdo, int $limit = 10): array
{
    ensure_email_queue_table($pdo);
    $limit = max(1, min(50, $limit));
    $lockToken = bin2hex(random_bytes(16));

    // Reset stale locks so a crashed cron run does not block the queue forever.
    $pdo->exec(
        "UPDATE email_queue
         SET status = 'pending', locked_at = NULL, last_error = CONCAT(COALESCE(last_error, ''), '\nStale processing lock reset.'), updated_at = NOW()
         WHERE status = 'processing'
           AND locked_at < (NOW() - INTERVAL 10 MINUTE)"
    );

    $pdo->beginTransaction();
    try {
        $select = $pdo->prepare(
            "SELECT id
             FROM email_queue
             WHERE status = 'pending'
               AND available_at <= NOW()
               AND attempts < max_attempts
             ORDER BY id ASC
             LIMIT {$limit}
             FOR UPDATE"
        );
        $select->execute();
        $ids = array_map('intval', $select->fetchAll(PDO::FETCH_COLUMN));

        if ($ids === []) {
            $pdo->commit();
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $update = $pdo->prepare(
            "UPDATE email_queue
             SET status = 'processing', locked_at = NOW(), last_error = ?, updated_at = NOW()
             WHERE id IN ({$placeholders})"
        );
        $update->execute(array_merge([$lockToken], $ids));
        $pdo->commit();

        $fetch = $pdo->prepare("SELECT * FROM email_queue WHERE last_error = :token AND status = 'processing' ORDER BY id ASC");
        $fetch->execute([':token' => $lockToken]);
        return $fetch->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function email_queue_body_from_job(array $job): string
{
    $body = isset($job['body_html']) ? trim((string) $job['body_html']) : '';
    if ($body !== '') {
        return $body;
    }

    // Backward compatibility for your older queue table that stored data in payload_json.
    if (isset($job['payload_json']) && trim((string) $job['payload_json']) !== '') {
        $payload = json_decode((string) $job['payload_json'], true);
        if (is_array($payload)) {
            foreach (['body_html', 'html', 'body', 'message'] as $key) {
                if (!empty($payload[$key])) {
                    return (string) $payload[$key];
                }
            }
        }
    }

    return '<p>Email content was missing from the queue record.</p>';
}

function process_email_queue(PDO $pdo, int $limit = 10): array
{
    $jobs = lock_next_email_queue_batch($pdo, $limit);
    $processed = 0;
    $sent = 0;
    $failed = 0;

    foreach ($jobs as $job) {
        $processed++;
        $jobId = (int) $job['id'];
        $relatedType = $job['related_type'] !== null ? (string) $job['related_type'] : '';
        $relatedId = $job['related_id'] !== null ? (int) $job['related_id'] : null;
        $emailType = (string) $job['email_type'];
        $to = (string) $job['recipient_email'];
        $subject = (string) $job['subject'];
        $replyTo = $job['reply_to_email'] !== null ? (string) $job['reply_to_email'] : null;

        try {
            $bodyHtml = email_queue_body_from_job($job);
            $ok = send_html_email($to, $subject, $bodyHtml, $replyTo);

            if ($ok) {
                $update = $pdo->prepare(
                    "UPDATE email_queue
                     SET status = 'sent', attempts = attempts + 1, locked_at = NULL, last_error = NULL, sent_at = NOW(), updated_at = NOW()
                     WHERE id = :id"
                );
                $update->execute([':id' => $jobId]);

                track_email(
                    $pdo,
                    $relatedType,
                    $relatedId,
                    $to,
                    $subject,
                    $emailType,
                    true,
                    null
                );
                $sent++;
                continue;
            }

            throw new RuntimeException('PHPMailer returned false.');
        } catch (Throwable $e) {
            $error = mb_substr($e->getMessage(), 0, 1000);
            $attemptsAfter = (int) $job['attempts'] + 1;
            $maxAttempts = (int) $job['max_attempts'];
            $newStatus = $attemptsAfter >= $maxAttempts ? 'failed' : 'pending';

            $update = $pdo->prepare(
                "UPDATE email_queue
                 SET status = :status,
                     attempts = attempts + 1,
                     locked_at = NULL,
                     last_error = :last_error,
                     available_at = DATE_ADD(NOW(), INTERVAL LEAST(30, POW(2, attempts + 1)) MINUTE),
                     updated_at = NOW()
                 WHERE id = :id"
            );
            $update->execute([
                ':status' => $newStatus,
                ':last_error' => $error,
                ':id' => $jobId,
            ]);

            track_email(
                $pdo,
                $relatedType,
                $relatedId,
                $to,
                $subject,
                $emailType,
                false,
                $error
            );
            $failed++;
            error_log('Email queue job #' . $jobId . ' failed: ' . $error);
        }
    }

    return [
        'processed' => $processed,
        'sent' => $sent,
        'failed' => $failed,
        'remaining_pending' => (int) $pdo->query("SELECT COUNT(*) FROM email_queue WHERE status = 'pending' AND available_at <= NOW()")->fetchColumn(),
    ];
}
