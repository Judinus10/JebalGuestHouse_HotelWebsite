<?php
/**
 * Premium HTML email automation helper for Jebal Guest House.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bookings/booking-audit-helper.php';

require_once __DIR__ . '/../helpers.php';

$contactHelpers = __DIR__ . '/../settings/contact_helpers.php';
if (is_file($contactHelpers)) {
    require_once $contactHelpers;
}


function email_constant_value(string $name, mixed $default = ''): mixed
{
    return defined($name) ? constant($name) : $default;
}

function email_smtp_profile_for_from(?string $fromEmail): array
{
    $fromEmail = strtolower(trim((string) $fromEmail));
    $bookingFrom = strtolower(trim((string) email_constant_value('BOOKING_FROM_EMAIL')));
    $contactFrom = strtolower(trim((string) email_constant_value('CONTACT_FROM_EMAIL')));
    $adminFrom = strtolower(trim((string) email_constant_value('ADMIN_FROM_EMAIL')));

    $prefix = '';
    if ($fromEmail !== '' && $bookingFrom !== '' && $fromEmail === $bookingFrom) {
        $prefix = 'BOOKING_';
    } elseif ($fromEmail !== '' && $contactFrom !== '' && $fromEmail === $contactFrom) {
        $prefix = 'CONTACT_';
    } elseif ($fromEmail !== '' && $adminFrom !== '' && $fromEmail === $adminFrom) {
        $prefix = 'ADMIN_';
    }

    return [
        'host' => trim((string) email_constant_value($prefix . 'SMTP_HOST', email_constant_value('SMTP_HOST', ''))),
        'user' => trim((string) email_constant_value($prefix . 'SMTP_USER', email_constant_value('SMTP_USER', ''))),
        'pass' => trim((string) email_constant_value($prefix . 'SMTP_PASS', email_constant_value('SMTP_PASS', ''))),
        'port' => (int) email_constant_value($prefix . 'SMTP_PORT', email_constant_value('SMTP_PORT', 587)),
        'secure' => strtolower(trim((string) email_constant_value($prefix . 'SMTP_SECURE', email_constant_value('SMTP_SECURE', 'tls')))),
    ];
}

function email_sender_for_type(string $emailType, string $relatedType = ''): array
{
    $type = strtolower($emailType);
    $relatedType = strtolower($relatedType);

    if (str_contains($type, 'contact') || $relatedType === 'enquiry') {
        return [contact_from_email(), contact_from_name()];
    }

    if (str_contains($type, 'reminder') || str_contains($type, 'stay') || str_contains($type, 'admin_stay')) {
        return [admin_from_email(), admin_from_name()];
    }

    if ($relatedType === 'booking'
        || str_contains($type, 'booking')
        || str_contains($type, 'payment')
        || str_contains($type, 'invoice')
        || str_contains($type, 'cancel')
        || str_contains($type, 'expired')) {
        return [booking_from_email(), booking_from_name()];
    }

    return [email_env_address('FROM_EMAIL'), email_env_name('FROM_NAME')];
}

function send_html_email(string $to, string $subject, string $htmlBody, ?string $replyTo = null, ?string $fromEmailOverride = null, ?string $fromNameOverride = null): bool
{
    try {
        if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
            error_log('PHPMailer class not found. Check vendor/autoload.php path.');
            return false;
        }

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        $fromEmail = $fromEmailOverride !== null && trim($fromEmailOverride) !== ''
            ? trim($fromEmailOverride)
            : (defined('FROM_EMAIL') ? trim((string) FROM_EMAIL) : '');
        $fromName = $fromNameOverride !== null && trim($fromNameOverride) !== ''
            ? trim($fromNameOverride)
            : (defined('FROM_NAME') ? trim((string) FROM_NAME) : 'Jebal Guest House');

        $smtpProfile = email_smtp_profile_for_from($fromEmail);
        $smtpHost = $smtpProfile['host'];
        $smtpUser = $smtpProfile['user'];
        $smtpPass = $smtpProfile['pass'];
        $smtpPort = $smtpProfile['port'];
        $smtpSecure = $smtpProfile['secure'];

        if ($smtpHost === '' || $smtpUser === '' || $smtpPass === '' || $smtpPort < 1 || $fromEmail === '') {
            error_log('SMTP configuration missing for HTML email from ' . $fromEmail . ' using user ' . $smtpUser . '.');
            return false;
        }

        if (!filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            error_log('Invalid FROM email for HTML email: ' . $fromEmail);
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

        email_embed_used_icons($mail, $htmlBody);

        $mail->Subject = $subject;
        $mail->Body = $htmlBody;
        $mail->AltBody = html_to_plain_text($htmlBody);

        return $mail->send();
    } catch (Throwable $e) {
        error_log('PHPMailer HTML send failed: ' . $e->getMessage());
        return false;
    }
}


function email_icon_file_map(): array
{
    $base = __DIR__ . '/assets/email-icons';
    return [
        'check' => $base . '/check.png',
        'calendar' => $base . '/calendar.png',
        'bed' => $base . '/bed.png',
        'wallet' => $base . '/wallet.png',
        'user' => $base . '/user.png',
        'headset' => $base . '/headset.png',
        'mail' => $base . '/mail.png',
        'phone' => $base . '/phone.png',
        'web' => $base . '/web.png',
        'alert' => $base . '/alert.png',
        'close' => $base . '/close.png',
        'info' => $base . '/info.png',
        'ref' => $base . '/ref.png',
        'message' => $base . '/message.png',
        'lock' => $base . '/lock.png',
        'security' => $base . '/security.png',
        'time' => $base . '/time.png',
        'open' => $base . '/open.png',
        'location' => $base . '/location.png',
    ];
}

function email_embed_used_icons(\PHPMailer\PHPMailer\PHPMailer $mail, string $htmlBody): void
{
    foreach (email_icon_file_map() as $name => $path) {
        $cid = 'jebal-email-icon-' . $name;
        if (str_contains($htmlBody, 'cid:' . $cid) && is_file($path)) {
            $mail->addEmbeddedImage($path, $cid, basename($path), 'base64', 'image/png');
        }
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

function email_env_address(string $constantName, string $fallbackConstant = 'FROM_EMAIL'): string
{
    $value = defined($constantName) ? trim((string) constant($constantName)) : '';
    if ($value !== '' && filter_var($value, FILTER_VALIDATE_EMAIL)) {
        return $value;
    }

    $fallback = defined($fallbackConstant) ? trim((string) constant($fallbackConstant)) : '';
    return filter_var($fallback, FILTER_VALIDATE_EMAIL) ? $fallback : '';
}

function email_env_name(string $constantName, string $fallbackConstant = 'FROM_NAME'): string
{
    $value = defined($constantName) ? trim((string) constant($constantName)) : '';
    if ($value !== '') {
        return $value;
    }

    $fallback = defined($fallbackConstant) ? trim((string) constant($fallbackConstant)) : '';
    return $fallback !== '' ? $fallback : 'Jebal Guest House';
}

function booking_from_email(): string
{
    return email_env_address('BOOKING_FROM_EMAIL');
}

function booking_from_name(): string
{
    return email_env_name('BOOKING_FROM_NAME');
}

function contact_from_email(): string
{
    return email_env_address('CONTACT_FROM_EMAIL');
}

function contact_from_name(): string
{
    return email_env_name('CONTACT_FROM_NAME');
}

function admin_from_email(): string
{
    return email_env_address('ADMIN_FROM_EMAIL', 'ADMIN_EMAIL');
}

function admin_from_name(): string
{
    return email_env_name('ADMIN_FROM_NAME', 'FROM_NAME');
}

function booking_admin_email(): string
{
    $email = email_env_address('BOOKING_ADMIN_EMAIL', 'ADMIN_EMAIL');
    return $email !== '' ? $email : email_env_address('ADMIN_EMAIL', 'FROM_EMAIL');
}

function contact_admin_email(): string
{
    $email = email_env_address('CONTACT_ADMIN_EMAIL', 'ADMIN_EMAIL');
    return $email !== '' ? $email : email_env_address('ADMIN_EMAIL', 'FROM_EMAIL');
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

function send_tracked_email(
    PDO $pdo,
    string $relatedType,
    ?int $relatedId,
    string $to,
    string $subject,
    string $htmlBody,
    string $emailType,
    ?string $replyTo = null,
    ?string $fromEmail = null,
    ?string $fromName = null
): bool {
    if ($fromEmail === null || trim($fromEmail) === '') {
        [$fromEmail, $fromName] = email_sender_for_type($emailType, $relatedType);
    }

    $sent = send_html_email($to, $subject, $htmlBody, $replyTo, $fromEmail, $fromName);

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

function email_contact_settings(): array
{
    static $settings = null;
    if (is_array($settings)) {
        return $settings;
    }

    $defaults = function_exists('default_contact_settings') ? default_contact_settings() : [
        'business_name' => 'Jebal Guest House',
        'address' => 'Jebal Guest House, Sri Lanka',
        'phone' => '+94 77 123 4567',
        'reception_contact_number' => '+94 21 222 4567',
        'whatsapp_reservation_number' => '+94 77 123 4567',
        'email' => 'reservations@jebalguesthouse.com',
        'business_hours' => 'Daily · 7:00 AM – 10:00 PM',
        'facebook_link' => '',
        'instagram_link' => '',
        'map_embed_url' => '',
    ];

    $settings = $defaults;
    if (function_exists('get_db_connection') && function_exists('get_contact_settings')) {
        try {
            $settings = array_merge($defaults, get_contact_settings(get_db_connection()));
        } catch (Throwable $e) {
            error_log('Email contact settings fallback used: ' . $e->getMessage());
        }
    }
    return $settings;
}

function email_contact_value(string $key, string $fallback = ''): string
{
    $settings = email_contact_settings();
    $value = trim((string) ($settings[$key] ?? ''));
    return $value !== '' ? $value : $fallback;
}

function email_contact_phone(): string
{
    $phone = email_contact_value('phone');
    if ($phone === '') { $phone = email_contact_value('reception_contact_number'); }
    if ($phone === '') { $phone = email_contact_value('whatsapp_reservation_number', '+94 77 123 4567'); }
    return $phone;
}

function email_contact_email(): string
{
    return email_contact_value('email', 'reservations@jebalguesthouse.com');
}

function email_contact_address(): string
{
    return email_contact_value('address', 'Jebal Guest House, Sri Lanka');
}

function email_contact_website(): string
{
    $url = email_public_url();
    if ($url === '') { return 'www.jebalguesthouse.com'; }
    $host = parse_url($url, PHP_URL_HOST);
    return is_string($host) && $host !== '' ? $host : $url;
}

function email_icon_font_css(): string
{
    return '';
}

function email_button(string $label, string $url): string
{
    if ($url === '') {
        return '';
    }

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;">
        <tr>
            <td style="border-radius:10px;background:#987b58;box-shadow:0 10px 18px rgba(39,69,159,.18);">
                <a href="' . email_safe($url) . '" style="display:inline-block;padding:12px 22px;border-radius:10px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:.02em;">' . email_safe($label) . '</a>
            </td>
        </tr>
    </table>';
}

function email_badge(string $text, string $tone = 'gold'): string
{
    $styles = [
        'gold' => 'background:#fff3cf;color:#987b58;border:1px solid #ffe4a3;',
        'green' => 'background:#dcfce7;color:#05803c;border:1px solid #bbf7d0;',
        'red' => 'background:#fee2e2;color:#e11d48;border:1px solid #fecaca;',
        'blue' => 'background:#f7f4ef;color:#987b58;border:1px solid #d8c9b8;',
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
<title>' . email_safe($title) . '</title>' . email_icon_font_css() . '
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
' . $preheaderHtml . '
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;margin:0;padding:28px 14px;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:760px;border-collapse:separate;border-spacing:0;">
<tr>
<td style="background:#987b58;border-radius:18px 18px 0 0;padding:28px 30px;color:#ffffff;">
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
<div style="margin-top:8px;font-size:12px;color:#f7f4ef;line-height:1.4;">' . email_safe(email_contact_address()) . ' &nbsp;&bull;&nbsp; Comfortable Guest House</div>
</td>
</tr>
</table>
</td>
<td align="right" style="vertical-align:middle;color:#ffffff;">
<div style="font-size:13px;line-height:1.6;color:#ffffff;">Generated: ' . email_safe($generatedAt) . '</div>
<div style="margin-top:4px;font-size:13px;line-height:1.6;color:#ffffff;font-weight:700;">' . email_safe($title) . '</div>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background:#ffffff;border-left:1px solid #dfe7f2;border-right:1px solid #dfe7f2;padding:26px 30px 30px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#987b58;font-weight:800;">' . email_safe($title) . '</h1>
<div style="font-size:15px;line-height:1.7;color:#243145;">' . $content . '</div>
</td>
</tr>
<tr>
<td style="background:#f8fafc;border:1px solid #dfe7f2;border-top:0;border-radius:0 0 18px 18px;padding:20px 30px;">
<p style="margin:0 0 18px;color:#526179;font-size:13px;line-height:1.6;text-align:left;"><strong style="color:#987b58;">Notes:</strong> Keep this email for your records. For booking or billing queries, contact the guest house directly.</p>
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

function contact_email_icon(string $icon): string
{
    $iconHtml = booking_email_icon($icon);

    return '<td width="58" style="width:58px;vertical-align:top;padding:0 18px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="46" height="46" style="width:46px;height:46px;border-radius:999px;background:#f7f4ef;border:1px solid #d8c9b8;">
            <tr>
                <td align="center" valign="middle" style="width:46px;height:46px;text-align:center;color:#987b58;font-size:18px;line-height:1;">' . $iconHtml . '</td>
            </tr>
        </table>
    </td>';
}

function contact_email_shell(string $title, string $content, string $preheader = ''): string
{
    $brand = email_brand_name();
    $year = date('Y');
    $preheaderHtml = $preheader !== ''
        ? '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . email_safe($preheader) . '</div>'
        : '';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>' . email_safe($title) . '</title>' . email_icon_font_css() . '
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111111;">
' . $preheaderHtml . '
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#ffffff;margin:0;padding:22px 10px;">
<tr>
<td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:760px;background:#ffffff;border-radius:7px;border:1px solid #eee8e1;box-shadow:0 16px 38px rgba(86,61,35,.13);overflow:hidden;">
<tr>
<td align="left" style="padding:29px 38px 19px;background:#ffffff;text-align:left;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:38px;line-height:.95;color:#987b58;font-weight:700;letter-spacing:5px;text-transform:uppercase;">JEBAL</div>
    <div style="margin-top:8px;font-size:17px;line-height:1;color:#987b58;font-weight:700;letter-spacing:4px;text-transform:uppercase;">GUEST HOUSE</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:13px 0 0;">
        <tr>
            <td style="width:34px;border-top:1px solid #b89166;font-size:0;line-height:0;">&nbsp;</td>
            <td style="padding:0 12px;color:#987b58;font-size:15px;line-height:1.2;white-space:nowrap;">Comfortable Guest House</td>
            <td style="width:34px;border-top:1px solid #b89166;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
    </table>
</td>
</tr>
<tr>
<td style="height:2px;background:#987b58;font-size:0;line-height:0;">&nbsp;</td>
</tr>
<tr>
<td style="padding:35px 38px 29px;background:#ffffff;">
' . $content . '
</td>
</tr>
<tr>
<td style="padding:0 38px;background:#ffffff;">
    <div style="border-top:1px solid #d8d0c8;font-size:0;line-height:0;">&nbsp;</div>
</td>
</tr>
<tr>
<td align="center" style="padding:20px 28px 24px;background:#ffffff;">
    <p style="margin:0;color:#111111;font-size:16px;line-height:1.45;">Thank you for choosing ' . email_safe($brand) . '.<br>We look forward to serving you.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:13px 0 0;">
        <tr>
            <td style="width:44px;border-top:1px solid #b89166;font-size:0;line-height:0;">&nbsp;</td>
            <td style="padding:0 12px;color:#987b58;font-size:18px;line-height:1;">' . booking_email_icon('check') . '</td>
            <td style="width:44px;border-top:1px solid #b89166;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
    </table>
    <p style="margin:11px 0 0;color:#111111;font-size:14px;line-height:1.4;">&copy; ' . $year . ' ' . email_safe($brand) . '. All rights reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>';
}

function contact_reference_pill(string $ref): string
{
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 19px;">
        <tr>
            <td style="border-radius:999px;background:#987b58;padding:13px 21px;color:#ffffff;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.02em;">
                REFERENCE ID
                <span style="display:inline-block;margin:0 24px;color:#d7b07c;font-weight:400;">|</span>
                <span style="font-size:18px;letter-spacing:.04em;">' . email_safe($ref) . '</span>
            </td>
        </tr>
    </table>';
}

function contact_email_detail_card(array $rows): string
{
    $visibleRows = [];
    foreach ($rows as $row) {
        $label = (string) ($row['label'] ?? '');
        $value = (string) ($row['value'] ?? '');
        $icon = (string) ($row['icon'] ?? '•');

        if ($label === '' || $value === '') {
            continue;
        }

        $visibleRows[] = [
            'label' => $label,
            'value' => $value,
            'icon' => $icon,
        ];
    }

    if ($visibleRows === []) {
        return '';
    }

    $html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:0 0 20px;border:1px solid #ded6cf;border-radius:12px;border-collapse:separate;border-spacing:0;background:#ffffff;">';

    $count = count($visibleRows);
    foreach ($visibleRows as $index => $row) {
        $border = $index < $count - 1 ? 'border-bottom:1px solid #ded6cf;' : '';
        $html .= '<tr>
            <td style="padding:17px 20px;' . $border . '">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        ' . contact_email_icon($row['icon']) . '
                        <td style="vertical-align:middle;padding:0;color:#111111;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td width="36%" style="width:36%;padding:0 18px 0 0;color:#111111;font-size:15px;font-weight:700;line-height:1.4;">' . email_safe($row['label']) . '</td>
                                    <td width="1" style="width:1px;background:#d9d0c8;font-size:0;line-height:0;">&nbsp;</td>
                                    <td style="padding:0 0 0 35px;color:#111111;font-size:15px;font-weight:800;line-height:1.45;word-break:break-word;">' . nl2br(email_safe($row['value'])) . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>';
    }

    return $html . '</table>';
}

function contact_support_block(): string
{
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:22px 0 25px;background:#ffffff;border-radius:12px;">
        <tr>
            <td style="padding:18px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td width="43%" style="width:43%;vertical-align:middle;padding:0 20px 0 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="55" style="width:55px;vertical-align:middle;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="50" height="50" style="width:50px;height:50px;border-radius:999px;background:#987b58;">
                                            <tr><td align="center" valign="middle" style="color:#ffffff;font-size:20px;line-height:1;">' . booking_email_icon('headset', 24) . '</td></tr>
                                        </table>
                                    </td>
                                    <td style="padding-left:13px;vertical-align:middle;">
                                        <div style="font-size:17px;line-height:1.3;font-weight:800;color:#111111;">Need immediate assistance?</div>
                                        <div style="margin-top:4px;font-size:14px;line-height:1.4;color:#111111;">Our team is here to help you.</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td width="1" style="width:1px;background:#d6cdc3;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="vertical-align:middle;padding-left:28px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td style="padding:4px 18px 4px 0;color:#111111;font-size:14px;line-height:1.4;white-space:nowrap;"><span style="color:#987b58;font-size:18px;">' . booking_email_icon('phone') . '</span>&nbsp;&nbsp;' . email_safe(email_contact_phone()) . '</td>
                                    <td style="padding:4px 0;color:#111111;font-size:14px;line-height:1.4;white-space:nowrap;"><span style="color:#987b58;font-size:18px;">' . booking_email_icon('web') . '</span>&nbsp;&nbsp;' . email_safe(email_contact_website()) . '</td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 18px 4px 0;color:#111111;font-size:14px;line-height:1.4;white-space:nowrap;"><span style="color:#987b58;font-size:18px;">' . booking_email_icon('mail') . '</span>&nbsp;&nbsp;' . email_safe(email_contact_email()) . '</td>
                                    <td style="padding:4px 0;color:#111111;font-size:14px;line-height:1.4;white-space:nowrap;"><span style="color:#987b58;font-size:18px;">' . booking_email_icon('location') . '</span>&nbsp;&nbsp;' . email_safe(email_contact_address()) . '</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>';
}

function contact_customer_email_html(string $name, string $email, string $phone, string $subject, string $message, string $ref = ''): string
{
    $safeName = trim($name) !== '' ? trim($name) : 'Guest';
    $year = date('Y');
    $brand = email_brand_name();
    $websiteUrl = email_public_url();
    $websiteLabel = email_contact_website();
    $contactPhone = email_contact_phone();
    $contactEmail = email_contact_email();

    $detailRows = [
        'Name' => $safeName,
        'Email' => $email,
        'Phone' => $phone,
        'Subject' => $subject,
        'Message' => $message,
    ];

    $detailsHtml = '';
    foreach ($detailRows as $label => $value) {
        $value = trim((string) $value);
        if ($value === '') {
            continue;
        }

        $detailsHtml .= '<tr class="contact-detail-row">
            <td class="contact-detail-label" style="width:27%;padding:12px 16px 12px 18px;border-bottom:1px solid #e6e9ef;color:#071230;font-size:14px;line-height:1.45;font-weight:700;vertical-align:top;">' . email_safe((string) $label) . '</td>
            <td class="contact-detail-colon" style="width:24px;padding:12px 5px;border-bottom:1px solid #e6e9ef;color:#071230;font-size:14px;line-height:1.45;vertical-align:top;">:</td>
            <td class="contact-detail-value" style="padding:12px 18px;border-bottom:1px solid #e6e9ef;color:#071230;font-size:14px;line-height:1.55;vertical-align:top;word-break:break-word;">' . nl2br(email_safe($value)) . '</td>
        </tr>';
    }

    $preheader = '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">We received your message and will reply as soon as possible.</div>';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>We received your message</title>
<style>
  body{margin:0!important;padding:0!important;background:#ffffff!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{border:0;display:block;outline:none;text-decoration:none;}
  a{text-decoration:none;}
  .contact-card{width:680px;max-width:680px;}
  .contact-main{padding:28px 34px 0;}
  .contact-header{padding:25px 34px 18px;}
  .contact-brand-title{font-size:21px;}
  .contact-brand-subtitle{font-size:14px;}
  .contact-hero-icon-cell{width:82px;padding-right:22px;vertical-align:middle;}
  .contact-hero-copy{text-align:left;vertical-align:middle;}
  .contact-hero-title{font-size:25px;}
  .contact-details-title{font-size:17px;}
  .contact-help-items td{white-space:nowrap;}
  .contact-footer{padding:25px 20px;}

  @media only screen and (max-width:720px){
    .contact-card{width:100%!important;max-width:100%!important;}
    .contact-outer{padding:18px 14px!important;}
    .contact-main{padding:26px 28px 0!important;}
    .contact-header{padding:24px 28px 17px!important;}
    .contact-help-items td{display:block!important;width:100%!important;padding:5px 0!important;white-space:normal!important;}
    .contact-help-divider{display:none!important;}
  }

  @media only screen and (max-width:520px){
    .contact-outer{padding:0!important;}
    .contact-card{border-left:0!important;border-right:0!important;border-radius:0!important;}
    .contact-header{padding:23px 20px 17px!important;text-align:center!important;}
    .contact-header-left,.contact-header-right{display:block!important;width:100%!important;text-align:center!important;}
    .contact-header-right{display:none!important;}
    .contact-brand-title{font-size:20px!important;}
    .contact-brand-subtitle{font-size:13px!important;margin-top:8px!important;}
    .contact-main{padding:18px 20px 0!important;}
    .contact-hero-icon-cell,.contact-hero-copy{display:block!important;width:100%!important;padding:0!important;text-align:center!important;}
    .contact-hero-icon{margin:0 auto 18px!important;width:64px!important;height:64px!important;}
    .contact-hero-check{font-size:29px!important;line-height:58px!important;width:58px!important;height:58px!important;}
    .contact-hero-title{font-size:21px!important;margin:0 0 10px!important;}
    .contact-hero-text{font-size:14px!important;line-height:1.5!important;}
    .contact-details-wrap{margin-top:28px!important;}
    .contact-details-title{font-size:16px!important;margin-bottom:10px!important;}
    .contact-detail-row{display:block!important;padding:10px 12px!important;border-bottom:0!important;}
    .contact-detail-label,.contact-detail-colon,.contact-detail-value{display:block!important;width:100%!important;box-sizing:border-box!important;border:0!important;padding:0!important;}
    .contact-detail-label{font-size:13px!important;line-height:1.35!important;margin-bottom:2px!important;}
    .contact-detail-colon{display:none!important;}
    .contact-detail-value{font-size:13px!important;line-height:1.45!important;margin-bottom:6px!important;}
    .contact-next{margin-top:12px!important;}
    .contact-next-cell{padding:11px 12px!important;}
    .contact-next-icon{width:28px!important;vertical-align:top!important;}
    .contact-next-title{font-size:14px!important;}
    .contact-next-text{font-size:13px!important;line-height:1.45!important;}
    .contact-help{padding:18px 0 20px!important;}
    .contact-help-title{font-size:14px!important;}
    .contact-help-items td{font-size:13px!important;}
    .contact-footer{padding:18px 20px!important;font-size:12px!important;line-height:1.6!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#071230;">
' . $preheader . '
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="contact-outer" style="width:100%;background:#ffffff;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="contact-card" style="width:680px;max-width:680px;background:#ffffff;border:1px solid #dfe3ea;box-shadow:0 8px 26px rgba(15,28,55,.06);">
<tr>
<td class="contact-header" style="padding:25px 34px 18px;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="contact-header-left" align="left" style="vertical-align:middle;">
        <div class="contact-brand-title" style="font-size:21px;line-height:1.25;font-weight:800;color:#071230;">' . email_safe($brand) . '</div>
        <div class="contact-brand-subtitle" style="margin-top:7px;font-size:14px;line-height:1.4;color:#37415b;">A Clean and Comfortable Stay</div>
      </td>
      <td class="contact-header-right" align="right" style="vertical-align:middle;font-size:12px;line-height:1.4;">
        <a href="' . email_safe($websiteUrl) . '" style="color:#034fbd;text-decoration:none;">View in browser</a>
      </td>
    </tr>
  </table>
</td>
</tr>
<tr><td style="padding:0 34px;"><div style="height:1px;background:#dfe3ea;font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr>
<td class="contact-main" style="padding:28px 34px 0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="contact-hero-icon-cell" style="width:82px;padding-right:22px;vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="contact-hero-icon" style="width:74px;height:74px;border-radius:50%;background:#eef8ef;">
          <tr><td align="center" valign="middle">
            <div class="contact-hero-check" style="width:60px;height:60px;border-radius:50%;color:#23883c;font-size:31px;font-weight:700;line-height:60px;text-align:center;">&#10003;</div>
          </td></tr>
        </table>
      </td>
      <td class="contact-hero-copy" style="vertical-align:middle;text-align:left;">
        <h1 class="contact-hero-title" style="margin:0 0 12px;color:#071230;font-size:25px;line-height:1.2;font-weight:800;">Thank You!</h1>
        <p class="contact-hero-text" style="margin:0;color:#071230;font-size:15px;line-height:1.55;">We have received your message.<br>Our team will get back to you as soon as possible.</p>
      </td>
    </tr>
  </table>

  <div class="contact-details-wrap" style="margin-top:36px;">
    <h2 class="contact-details-title" style="margin:0 0 14px;color:#071230;font-size:17px;line-height:1.3;font-weight:800;">Your Message Details</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #dfe3ea;border-radius:5px;border-collapse:separate;overflow:hidden;background:#ffffff;">' . $detailsHtml . '</table>
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="contact-next" style="width:100%;margin-top:24px;border:1px solid #cfe0fb;border-radius:5px;background:#f3f7ff;">
    <tr>
      <td class="contact-next-cell" style="padding:14px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="contact-next-icon" style="width:36px;vertical-align:middle;">
              <div style="width:24px;height:24px;border-radius:50%;background:#1765bf;color:#ffffff;font-size:15px;line-height:24px;text-align:center;font-weight:800;">i</div>
            </td>
            <td style="vertical-align:middle;">
              <div class="contact-next-title" style="color:#071230;font-size:14px;line-height:1.35;font-weight:800;">What\'s Next?</div>
              <div class="contact-next-text" style="margin-top:5px;color:#071230;font-size:14px;line-height:1.45;">We will review your message and respond to you at the earliest.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <div class="contact-help" style="margin-top:24px;padding:22px 0 24px;border-top:1px solid #dfe3ea;">
    <div class="contact-help-title" style="margin:0 0 14px;color:#071230;font-size:14px;line-height:1.35;font-weight:800;">Need help?</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="contact-help-items" style="width:100%;">
      <tr>
        <td style="padding-right:24px;color:#071230;font-size:13px;line-height:1.5;">' . booking_email_icon('phone', 17) . '&nbsp;&nbsp;' . email_safe($contactPhone) . '</td>
        <td style="padding-right:24px;color:#071230;font-size:13px;line-height:1.5;">' . booking_email_icon('mail', 17) . '&nbsp;&nbsp;' . email_safe($contactEmail) . '</td>
        <td style="color:#071230;font-size:13px;line-height:1.5;">' . booking_email_icon('web', 17) . '&nbsp;&nbsp;<a href="' . email_safe($websiteUrl) . '" style="color:#071230;text-decoration:none;">' . email_safe($websiteLabel) . '</a></td>
      </tr>
    </table>
  </div>
</td>
</tr>
<tr>
<td class="contact-footer" align="center" style="padding:25px 20px;background:#f6f7fa;border-top:1px solid #e3e6ec;color:#4a536b;font-size:13px;line-height:1.5;text-align:center;">&copy; ' . $year . ' ' . email_safe($brand) . '. All rights reserved.</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>';
}

function contact_admin_email_html(string $name, string $email, string $phone, string $subject, string $message, string $ref): string
{
    $year = date('Y');
    $brand = email_brand_name();
    $websiteUrl = email_public_url();
    $websiteLabel = email_contact_website();
    $contactPhone = email_contact_phone();
    $contactEmail = email_contact_email();
    $dashboardUrl = reminder_email_admin_dashboard_url();

    $detailRows = [
        'Name' => $name,
        'Email' => $email,
        'Phone' => $phone,
        'Subject' => $subject,
        'Message' => $message,
    ];

    $detailsHtml = '';
    foreach ($detailRows as $label => $value) {
        $value = trim((string) $value);
        if ($value === '') {
            continue;
        }

        $detailsHtml .= '<tr class="admin-contact-detail-row">
            <td class="admin-contact-detail-label" style="width:28%;padding:11px 16px 11px 18px;border-bottom:1px solid #e6e9ef;color:#071230;font-size:14px;line-height:1.45;font-weight:700;vertical-align:top;">' . email_safe((string) $label) . '</td>
            <td class="admin-contact-detail-colon" style="width:24px;padding:11px 5px;border-bottom:1px solid #e6e9ef;color:#071230;font-size:14px;line-height:1.45;vertical-align:top;">:</td>
            <td class="admin-contact-detail-value" style="padding:11px 18px;border-bottom:1px solid #e6e9ef;color:#071230;font-size:14px;line-height:1.55;vertical-align:top;word-break:break-word;">' . nl2br(email_safe($value)) . '</td>
        </tr>';
    }

    $buttonHtml = $dashboardUrl !== ''
        ? '<a href="' . email_safe($dashboardUrl) . '" class="admin-contact-button" style="display:inline-block;min-width:268px;padding:13px 24px;background:#071b52;color:#ffffff;border-radius:5px;font-size:14px;line-height:1.3;font-weight:800;text-align:center;text-decoration:none;box-sizing:border-box;">View Message in Dashboard</a>'
        : '<span class="admin-contact-button" style="display:inline-block;min-width:268px;padding:13px 24px;background:#071b52;color:#ffffff;border-radius:5px;font-size:14px;line-height:1.3;font-weight:800;text-align:center;box-sizing:border-box;">View Message in Dashboard</span>';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Contact Message Received</title>
<style>
  body{margin:0!important;padding:0!important;background:#ffffff!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{border:0;display:block;outline:none;text-decoration:none;}
  a{text-decoration:none;}
  .admin-contact-card{width:680px;max-width:680px;}
  .admin-contact-header{padding:25px 34px 18px;}
  .admin-contact-main{padding:24px 34px 0;}
  .admin-contact-brand-title{font-size:21px;}
  .admin-contact-brand-subtitle{font-size:14px;}
  .admin-contact-hero-icon-cell{width:82px;padding-right:20px;vertical-align:top;}
  .admin-contact-hero-copy{vertical-align:top;text-align:left;}
  .admin-contact-hero-title{font-size:24px;}
  .admin-contact-help-items td{white-space:nowrap;}
  .admin-contact-footer{padding:25px 20px;}

  @media only screen and (max-width:720px){
    .admin-contact-card{width:100%!important;max-width:100%!important;}
    .admin-contact-outer{padding:18px 14px!important;}
    .admin-contact-header{padding:24px 28px 17px!important;}
    .admin-contact-main{padding:22px 28px 0!important;}
    .admin-contact-help-items td{display:block!important;width:100%!important;padding:5px 0!important;white-space:normal!important;}
  }

  @media only screen and (max-width:520px){
    .admin-contact-outer{padding:0!important;}
    .admin-contact-card{border-left:0!important;border-right:0!important;border-radius:0!important;}
    .admin-contact-header{padding:23px 20px 17px!important;text-align:center!important;}
    .admin-contact-header-left,.admin-contact-header-right{display:block!important;width:100%!important;text-align:center!important;}
    .admin-contact-header-right{display:none!important;}
    .admin-contact-brand-title{font-size:20px!important;}
    .admin-contact-brand-subtitle{font-size:13px!important;margin-top:8px!important;}
    .admin-contact-main{padding:19px 20px 0!important;}
    .admin-contact-hero-icon-cell{width:58px!important;padding:0 14px 0 0!important;vertical-align:top!important;}
    .admin-contact-hero-icon{width:54px!important;height:54px!important;}
    .admin-contact-hero-copy{vertical-align:top!important;text-align:left!important;}
    .admin-contact-hero-title{font-size:20px!important;line-height:1.28!important;margin:5px 0 9px!important;}
    .admin-contact-hero-text{font-size:13px!important;line-height:1.55!important;}
    .admin-contact-details-wrap{margin-top:25px!important;}
    .admin-contact-details-title{font-size:16px!important;margin-bottom:10px!important;}
    .admin-contact-detail-row{display:block!important;padding:9px 11px!important;border-bottom:0!important;}
    .admin-contact-detail-label,.admin-contact-detail-colon,.admin-contact-detail-value{display:block!important;width:100%!important;box-sizing:border-box!important;border:0!important;padding:0!important;}
    .admin-contact-detail-label{font-size:13px!important;line-height:1.35!important;margin-bottom:2px!important;}
    .admin-contact-detail-colon{display:none!important;}
    .admin-contact-detail-value{font-size:13px!important;line-height:1.45!important;margin-bottom:5px!important;}
    .admin-contact-info{margin-top:12px!important;}
    .admin-contact-info-cell{padding:11px 12px!important;}
    .admin-contact-info-icon{width:28px!important;vertical-align:top!important;}
    .admin-contact-info-title{font-size:14px!important;}
    .admin-contact-info-text{font-size:13px!important;line-height:1.45!important;}
    .admin-contact-action{padding:13px 0 18px!important;}
    .admin-contact-button{display:block!important;width:100%!important;min-width:0!important;padding:11px 16px!important;font-size:13px!important;}
    .admin-contact-help{padding:17px 0 20px!important;}
    .admin-contact-help-items td{font-size:13px!important;}
    .admin-contact-footer{padding:17px 20px!important;font-size:12px!important;line-height:1.65!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#071230;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A new website contact message has been received.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="admin-contact-outer" style="width:100%;background:#ffffff;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="admin-contact-card" style="width:680px;max-width:680px;background:#ffffff;border:1px solid #dfe3ea;box-shadow:0 8px 26px rgba(15,28,55,.06);">
<tr>
<td class="admin-contact-header" style="padding:25px 34px 18px;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="admin-contact-header-left" align="left" style="vertical-align:middle;">
        <div class="admin-contact-brand-title" style="font-size:21px;line-height:1.25;font-weight:800;color:#071230;">' . email_safe($brand) . '</div>
        <div class="admin-contact-brand-subtitle" style="margin-top:7px;font-size:14px;line-height:1.4;color:#37415b;">A Clean and Comfortable Stay</div>
      </td>
      <td class="admin-contact-header-right" align="right" style="vertical-align:middle;font-size:12px;line-height:1.4;">
        <a href="' . email_safe($websiteUrl) . '" style="color:#034fbd;text-decoration:none;">View in browser</a>
      </td>
    </tr>
  </table>
</td>
</tr>
<tr><td style="padding:0 34px;"><div style="height:1px;background:#dfe3ea;font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr>
<td class="admin-contact-main" style="padding:24px 34px 0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="admin-contact-hero-icon-cell" style="width:82px;padding-right:20px;vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="admin-contact-hero-icon" style="width:72px;height:72px;border-radius:50%;background:#f1f5fd;">
          <tr><td align="center" valign="middle" style="color:#071b52;">' . booking_email_icon('mail', 34) . '</td></tr>
        </table>
      </td>
      <td class="admin-contact-hero-copy" style="vertical-align:top;text-align:left;">
        <h1 class="admin-contact-hero-title" style="margin:9px 0 12px;color:#071230;font-size:24px;line-height:1.2;font-weight:800;">New Contact Message Received</h1>
        <p class="admin-contact-hero-text" style="margin:0;color:#071230;font-size:14px;line-height:1.55;">You have received a new message from your website contact form.<br>Please find the details below.</p>
      </td>
    </tr>
  </table>

  <div class="admin-contact-details-wrap" style="margin-top:30px;">
    <h2 class="admin-contact-details-title" style="margin:0 0 14px;color:#071230;font-size:17px;line-height:1.3;font-weight:800;">Contact Details</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #dfe3ea;border-radius:5px;border-collapse:separate;overflow:hidden;background:#ffffff;">' . $detailsHtml . '</table>
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="admin-contact-info" style="width:100%;margin-top:20px;border:1px solid #cfe0fb;border-radius:5px;background:#f3f7ff;">
    <tr>
      <td class="admin-contact-info-cell" style="padding:13px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="admin-contact-info-icon" style="width:36px;vertical-align:middle;">
              <div style="width:24px;height:24px;border-radius:50%;background:#1765bf;color:#ffffff;font-size:15px;line-height:24px;text-align:center;font-weight:800;">i</div>
            </td>
            <td style="vertical-align:middle;">
              <div class="admin-contact-info-title" style="color:#071230;font-size:14px;line-height:1.35;font-weight:800;">Important Information</div>
              <div class="admin-contact-info-text" style="margin-top:5px;color:#071230;font-size:14px;line-height:1.45;">Please respond to the guest at your earliest convenience.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <div class="admin-contact-action" style="padding:19px 0 25px;text-align:center;">' . $buttonHtml . '</div>

  <div class="admin-contact-help" style="padding:21px 0 24px;border-top:1px solid #dfe3ea;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="admin-contact-help-items" style="width:100%;">
      <tr>
        <td style="padding-right:24px;color:#071230;font-size:13px;line-height:1.5;">' . booking_email_icon('phone', 17) . '&nbsp;&nbsp;' . email_safe($contactPhone) . '</td>
        <td style="padding-right:24px;color:#071230;font-size:13px;line-height:1.5;">' . booking_email_icon('mail', 17) . '&nbsp;&nbsp;' . email_safe($contactEmail) . '</td>
        <td style="color:#071230;font-size:13px;line-height:1.5;">' . booking_email_icon('web', 17) . '&nbsp;&nbsp;<a href="' . email_safe($websiteUrl) . '" style="color:#071230;text-decoration:none;">' . email_safe($websiteLabel) . '</a></td>
      </tr>
    </table>
  </div>
</td>
</tr>
<tr>
<td class="admin-contact-footer" align="center" style="padding:25px 20px;background:#f6f7fa;border-top:1px solid #e3e6ec;color:#4a536b;font-size:13px;line-height:1.5;text-align:center;">&copy; ' . $year . ' ' . email_safe($brand) . '. All rights reserved.</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>';
}


function reminder_email_format_date(string $date): string
{
    $date = trim($date);
    if ($date === '') {
        return '-';
    }
    $ts = strtotime($date);
    return $ts ? date('d F Y', $ts) : $date;
}

function reminder_email_admin_dashboard_url(): string
{
    $base = defined('ADMIN_APP_URL') && trim((string) ADMIN_APP_URL) !== ''
        ? trim((string) ADMIN_APP_URL)
        : (defined('APP_BASE_URL') ? trim((string) APP_BASE_URL) : '');

    return $base !== '' ? rtrim($base, '/') : '';
}

function reminder_email_display_date(string $date): string
{
    $timestamp = strtotime(trim($date));
    return $timestamp ? date('j F Y (l)', $timestamp) : trim($date);
}

function reminder_email_display_time(array $booking, string $type): string
{
    $keys = $type === 'checkout'
        ? ['check_out_time', 'checkout_time', 'departure_time']
        : ['check_in_time', 'checkin_time', 'arrival_time'];

    foreach ($keys as $key) {
        $value = trim((string) ($booking[$key] ?? ''));
        if ($value !== '') {
            $timestamp = strtotime($value);
            return $timestamp ? date('h:i A', $timestamp) : $value;
        }
    }

    $dateKey = $type === 'checkout' ? 'check_out_date' : 'check_in_date';
    $value = trim((string) ($booking[$dateKey] ?? ''));
    if ($value !== '') {
        $timestamp = strtotime($value);
        if ($timestamp && date('H:i:s', $timestamp) !== '00:00:00') {
            return date('h:i A', $timestamp);
        }
    }

    return '-';
}

function reminder_email_room_number(array $booking): string
{
    foreach (['room_number', 'room_no', 'room_code', 'assigned_room_number'] as $key) {
        $value = trim((string) ($booking[$key] ?? ''));
        if ($value !== '') {
            return $value;
        }
    }
    return '-';
}

function reminder_email_nights(array $booking): string
{
    $stored = (int) ($booking['nights'] ?? 0);
    if ($stored > 0) {
        return (string) $stored;
    }

    $checkIn = strtotime((string) ($booking['check_in_date'] ?? ''));
    $checkOut = strtotime((string) ($booking['check_out_date'] ?? ''));
    if ($checkIn && $checkOut && $checkOut > $checkIn) {
        return (string) max(1, (int) round(($checkOut - $checkIn) / 86400));
    }

    return '1';
}

function reminder_email_shell(string $title, string $content, string $preheader = '', string $sideTitle = 'Stay Reminder', string $sideSubTitle = 'Check-in Reminder'): string
{
    $year = date('Y');
    $browserUrl = email_public_url();
    $browserLink = $browserUrl !== ''
        ? '<a class="daily-browser-link" href="' . email_safe($browserUrl) . '" style="color:#0b4cad;text-decoration:none;font-size:13px;line-height:20px;">View in browser</a>'
        : '';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>' . email_safe($title) . '</title>' . email_icon_font_css() . '
<style>
@media only screen and (max-width:680px){
  .daily-outer{padding:18px 10px!important;}
  .daily-card{width:100%!important;max-width:560px!important;}
  .daily-header{padding:24px 28px 18px!important;}
  .daily-body{padding:18px 28px 24px!important;}
  .daily-hero-icon{width:62px!important;}
  .daily-hero-icon-box{width:56px!important;height:56px!important;line-height:56px!important;}
  .daily-title{font-size:20px!important;}
  .daily-section-title{margin-top:25px!important;}
  .daily-table th,.daily-table td{padding:10px 12px!important;font-size:12px!important;}
  .daily-room-number{display:none!important;}
  .daily-help-inner td{display:block!important;width:auto!important;padding:4px 0!important;}
  .daily-help-links{padding-top:8px!important;}
}
@media only screen and (max-width:430px){
  .daily-outer{padding:0!important;}
  .daily-card{border-left:1px solid #dce3ee!important;border-right:1px solid #dce3ee!important;box-shadow:none!important;}
  .daily-header{padding:22px 20px 16px!important;}
  .daily-browser-link{display:none!important;}
  .daily-body{padding:14px 20px 20px!important;}
  .daily-hero-icon{width:52px!important;vertical-align:top!important;}
  .daily-hero-icon-box{width:46px!important;height:46px!important;line-height:46px!important;}
  .daily-hero-copy{padding-left:12px!important;}
  .daily-title{font-size:18px!important;line-height:23px!important;}
  .daily-date{font-size:14px!important;}
  .daily-intro{font-size:13px!important;line-height:20px!important;}
  .daily-section-title{font-size:14px!important;margin:22px 0 10px!important;}
  .daily-table{table-layout:fixed!important;}
  .daily-table th{padding:9px 8px!important;font-size:10px!important;line-height:14px!important;}
  .daily-table td{padding:9px 8px!important;font-size:10px!important;line-height:15px!important;word-break:normal!important;}
  .daily-checkins .daily-guest{width:28%!important;}
  .daily-checkins .daily-room{width:25%!important;}
  .daily-checkins .daily-time{width:31%!important;}
  .daily-checkins .daily-nights{width:16%!important;text-align:center!important;}
  .daily-checkouts .daily-guest{width:34%!important;}
  .daily-checkouts .daily-room{width:29%!important;}
  .daily-checkouts .daily-time{width:37%!important;}
  .daily-total{font-size:12px!important;padding:10px 12px!important;}
  .daily-summary{padding:12px!important;}
  .daily-summary-title{font-size:12px!important;}
  .daily-summary-values{font-size:10px!important;white-space:nowrap!important;}
  .daily-summary-badge{padding:4px 7px!important;margin:0 4px!important;}
  .daily-help{padding:14px 20px 16px!important;}
  .daily-help-title{font-size:13px!important;}
  .daily-help-links{font-size:12px!important;line-height:2!important;}
  .daily-footer{padding:16px 20px!important;font-size:12px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#07143b;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . email_safe($preheader) . '</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="daily-outer" style="width:100%;border-collapse:collapse;background:#ffffff;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="760" cellspacing="0" cellpadding="0" class="daily-card" style="width:760px;max-width:760px;border-collapse:collapse;background:#ffffff;border:1px solid #dce3ee;box-shadow:0 10px 32px rgba(15,23,42,.05);">
<tr><td class="daily-header" style="padding:27px 32px 20px;background:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td align="left">
<div style="font-size:21px;line-height:27px;font-weight:800;color:#07143b;">Jebal Guest House</div>
<div style="margin-top:3px;font-size:14px;line-height:21px;color:#34405d;">A Clean and Comfortable Stay</div>
</td>
<td align="right" valign="top">' . $browserLink . '</td>
</tr></table>
<div style="height:1px;background:#d8e0eb;margin-top:19px;font-size:0;line-height:0;">&nbsp;</div>
</td></tr>
<tr><td class="daily-body" style="padding:17px 32px 25px;background:#ffffff;">' . $content . '</td></tr>
<tr><td>' . reminder_email_help_block() . '</td></tr>
<tr><td class="daily-footer" style="padding:19px 24px 21px;text-align:center;background:#f7f9fc;border-top:1px solid #e3e8f0;color:#4c5872;font-size:12px;line-height:19px;">&copy; ' . $year . ' Jebal Guest House. All rights reserved.</td></tr>
</table>
</td></tr></table>
</body></html>';
}

function reminder_email_help_block(): string
{
    return '<div class="daily-help" style="margin:0 32px;padding:18px 0 20px;border-top:1px solid #dfe5ee;background:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="daily-help-inner">
<tr>
<td style="vertical-align:top;width:145px;padding-right:18px;"><div class="daily-help-title" style="font-size:13px;font-weight:800;color:#07143b;line-height:20px;">Need help?</div></td>
<td class="daily-help-links" style="font-size:12px;line-height:24px;color:#07143b;">
<span style="display:inline-block;margin-right:28px;white-space:nowrap;">' . booking_email_icon('phone', 15) . '&nbsp;&nbsp;' . email_safe(email_contact_phone()) . '</span>
<span style="display:inline-block;margin-right:28px;white-space:nowrap;">' . booking_email_icon('mail', 15) . '&nbsp;&nbsp;' . email_safe(email_contact_email()) . '</span>
<span style="display:inline-block;white-space:nowrap;">' . booking_email_icon('web', 15) . '&nbsp;&nbsp;' . email_safe(email_contact_website()) . '</span>
</td>
</tr>
</table>
</div>';
}

function reminder_email_total_bar(string $type, int $count): string
{
    $isCheckIn = $type === 'checkin';
    $label = $isCheckIn ? 'Total Check-ins Today:' : 'Total Check-outs Today:';
    $background = $isCheckIn ? '#f4fbf4' : '#fff9ee';
    $border = $isCheckIn ? '#d8ecd9' : '#f1dfb9';
    $color = $isCheckIn ? '#167a2b' : '#9a6100';
    $icon = $isCheckIn ? 'user' : 'open';

    return '<div class="daily-total" style="margin:12px 0 0;padding:11px 16px;border:1px solid ' . $border . ';border-radius:5px;background:' . $background . ';color:' . $color . ';font-size:13px;line-height:20px;">'
        . '<span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:' . $color . ';color:#ffffff;text-align:center;line-height:22px;margin-right:10px;vertical-align:middle;">' . booking_email_icon($icon, 12) . '</span>'
        . '<span style="vertical-align:middle;">' . email_safe($label) . ' <strong>' . $count . '</strong></span></div>';
}

function reminder_email_bookings_section(string $title, array $bookings, string $emptyText, string $type = 'checkin'): string
{
    $isCheckIn = $type === 'checkin';
    $rows = '';

    foreach ($bookings as $booking) {
        $guest = trim((string) ($booking['guest_name'] ?? $booking['full_name'] ?? 'Guest')) ?: 'Guest';
        $room = trim((string) ($booking['room_name'] ?? $booking['room_type'] ?? '-')) ?: '-';
        $roomNumber = reminder_email_room_number($booking);
        $dateKey = $isCheckIn ? 'check_in_date' : 'check_out_date';
        $dateValue = trim((string) ($booking[$dateKey] ?? ''));
        $timeValue = reminder_email_display_time($booking, $isCheckIn ? 'checkin' : 'checkout');
        $timestamp = strtotime($dateValue);
        $formattedDate = $timestamp ? date('j M Y', $timestamp) : $dateValue;
        $dateTime = trim($formattedDate . ($timeValue !== '-' ? ', ' . $timeValue : ''));

        $rows .= '<tr>'
            . '<td class="daily-guest" style="padding:10px 13px;border-top:1px solid #e4e9f0;color:#07143b;font-size:12px;line-height:18px;">' . email_safe($guest) . '</td>'
            . '<td class="daily-room" style="padding:10px 13px;border-top:1px solid #e4e9f0;color:#07143b;font-size:12px;line-height:18px;">' . email_safe($room) . '</td>'
            . '<td class="daily-room-number" style="padding:10px 13px;border-top:1px solid #e4e9f0;color:#07143b;font-size:12px;line-height:18px;">' . email_safe($roomNumber) . '</td>'
            . '<td class="daily-time" style="padding:10px 13px;border-top:1px solid #e4e9f0;color:#07143b;font-size:12px;line-height:18px;">' . email_safe($dateTime !== '' ? $dateTime : '-') . '</td>'
            . ($isCheckIn ? '<td class="daily-nights" style="padding:10px 13px;border-top:1px solid #e4e9f0;color:#07143b;font-size:12px;line-height:18px;">' . email_safe(reminder_email_nights($booking)) . '</td>' : '')
            . '</tr>';
    }

    $columnCount = $isCheckIn ? 5 : 4;
    if ($rows === '') {
        $rows = '<tr><td colspan="' . $columnCount . '" style="padding:15px;color:#667085;font-size:12px;">' . email_safe($emptyText) . '</td></tr>';
    }

    $class = $isCheckIn ? 'daily-checkins' : 'daily-checkouts';
    $html = '<h2 class="daily-section-title" style="margin:25px 0 11px;color:#07143b;font-size:15px;line-height:21px;font-weight:800;">' . email_safe($title) . '</h2>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="daily-table ' . $class . '" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d9e1ec;border-radius:5px;overflow:hidden;">'
        . '<tr style="background:#edf4fc;color:#07143b;">'
        . '<th class="daily-guest" align="left" style="padding:10px 13px;font-size:11px;line-height:16px;font-weight:800;">Guest Name</th>'
        . '<th class="daily-room" align="left" style="padding:10px 13px;font-size:11px;line-height:16px;font-weight:800;">Room Type</th>'
        . '<th class="daily-room-number" align="left" style="padding:10px 13px;font-size:11px;line-height:16px;font-weight:800;">Room No.</th>'
        . '<th class="daily-time" align="left" style="padding:10px 13px;font-size:11px;line-height:16px;font-weight:800;">' . ($isCheckIn ? 'Check-in Time' : 'Check-out Time') . '</th>'
        . ($isCheckIn ? '<th class="daily-nights" align="left" style="padding:10px 13px;font-size:11px;line-height:16px;font-weight:800;">Nights</th>' : '')
        . '</tr>' . $rows . '</table>';

    return $html . reminder_email_total_bar($type, count($bookings));
}

function reminder_email_summary_block(int $checkInCount, int $checkOutCount, int $occupiedRooms): string
{
    return '<div class="daily-summary" style="margin-top:18px;padding:13px 16px;border:1px solid #d7e4f4;border-radius:5px;background:#f5f9ff;color:#07143b;">'
        . '<div class="daily-summary-title" style="font-size:12px;font-weight:800;line-height:18px;">'
        . '<span style="display:inline-block;width:21px;height:21px;border-radius:50%;background:#1662b6;color:#ffffff;text-align:center;line-height:21px;margin-right:10px;vertical-align:middle;">' . booking_email_icon('info', 11) . '</span>Summary</div>'
        . '<div class="daily-summary-values" style="margin-top:9px;padding-left:31px;font-size:12px;line-height:22px;">'
        . 'Total Check-ins: <span class="daily-summary-badge" style="display:inline-block;margin:0 12px 0 6px;padding:3px 8px;border-radius:7px;background:#e5f0ff;color:#0a56a6;font-weight:800;">' . $checkInCount . '</span>'
        . '<span style="color:#aab2c1;">|</span>&nbsp;&nbsp; Total Check-outs: <span class="daily-summary-badge" style="display:inline-block;margin:0 12px 0 6px;padding:3px 8px;border-radius:7px;background:#fff0cf;color:#9a6100;font-weight:800;">' . $checkOutCount . '</span>'
        . '<span style="color:#aab2c1;">|</span>&nbsp;&nbsp; Rooms Occupied: <span class="daily-summary-badge" style="display:inline-block;margin-left:6px;padding:3px 8px;border-radius:7px;background:#e2f5e4;color:#167a2b;font-weight:800;">' . $occupiedRooms . '</span>'
        . '</div></div>';
}

function stay_reminder_email_html(string $date, array $checkIns, array $checkOuts): string
{
    $checkInCount = count($checkIns);
    $checkOutCount = count($checkOuts);
    $occupiedRoomIds = [];

    foreach (array_merge($checkIns, $checkOuts) as $booking) {
        $roomIdentity = trim((string) ($booking['room_id'] ?? $booking['room_number'] ?? $booking['room_no'] ?? $booking['room_name'] ?? ''));
        if ($roomIdentity !== '') {
            $occupiedRoomIds[$roomIdentity] = true;
        }
    }

    $occupiedRooms = count($occupiedRoomIds);
    if ($occupiedRooms === 0) {
        $occupiedRooms = $checkInCount + $checkOutCount;
    }

    $displayDate = reminder_email_display_date($date);
    $content = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>'
        . '<td class="daily-hero-icon" style="width:78px;vertical-align:top;">'
        . '<div class="daily-hero-icon-box" style="width:64px;height:64px;border-radius:50%;background:#eef5ff;color:#071f60;text-align:center;line-height:64px;">' . booking_email_icon('calendar', 28) . '</div></td>'
        . '<td class="daily-hero-copy" style="vertical-align:top;padding-left:10px;">'
        . '<h1 class="daily-title" style="margin:3px 0 3px;color:#07143b;font-size:22px;line-height:28px;font-weight:800;">Daily Room Report</h1>'
        . '<div class="daily-date" style="color:#0759b4;font-size:14px;line-height:21px;font-weight:800;">' . email_safe($displayDate) . '</div>'
        . '<p class="daily-intro" style="margin:8px 0 0;color:#07143b;font-size:13px;line-height:21px;">Here is your daily summary of check-in and check-out for today.</p>'
        . '</td></tr></table>';

    $content .= reminder_email_bookings_section("Today's Check-ins", $checkIns, 'No check-ins scheduled for today.', 'checkin');
    $content .= reminder_email_bookings_section("Today's Check-outs", $checkOuts, 'No check-outs scheduled for today.', 'checkout');
    $content .= reminder_email_summary_block($checkInCount, $checkOutCount, $occupiedRooms);

    return reminder_email_shell('Daily Room Report', $content, 'Daily room report for ' . $displayDate . '.');
}

function otp_email_html(string $title, string $otp, int $validMinutes = 1): string
{
    $safeTitle = email_safe($title);
    $safeOtp = preg_replace('/\D+/', '', (string) $otp);
    if ($safeOtp === '') {
        $safeOtp = email_safe($otp);
    }

    $digitsHtml = '';
    foreach (str_split((string) $safeOtp) as $digit) {
        $digitsHtml .= '<td class="otp-digit" style="padding:0 5px;">
            <div style="width:52px;height:58px;line-height:58px;border:1px solid #dfd3c5;border-radius:9px;background:#ffffff;color:#987b58;font-size:31px;font-weight:800;text-align:center;font-family:Arial,Helvetica,sans-serif;">' . email_safe($digit) . '</div>
        </td>';
    }

    $year = date('Y');
    $minutesText = (int) $validMinutes . ' minute' . ((int) $validMinutes === 1 ? '' : 's');

    return '<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>' . $safeTitle . '</title>' . email_icon_font_css() . '
<style>
@media only screen and (max-width: 620px) {
  .email-wrap { width: 100% !important; border-radius: 0 !important; }
  .email-pad { padding: 28px 18px !important; }
  .brand-left, .alert-right { display: block !important; width: 100% !important; text-align: center !important; }
  .alert-right { margin-top: 18px !important; }
  .alert-right table { margin: 0 auto !important; }
  .hero-icon { width: 86px !important; height: 86px !important; line-height: 86px !important; font-size: 42px !important; }
  .title { font-size: 23px !important; line-height: 29px !important; }
  .otp-box { padding: 12px 10px !important; }
  .otp-digit { padding: 0 3px !important; }
  .otp-digit div { width: 38px !important; height: 46px !important; line-height: 46px !important; font-size: 25px !important; }
  .security-table td, .help-table td { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: left !important; }
  .security-icon { padding: 18px 20px 0 !important; }
  .security-copy { padding: 10px 20px 18px !important; }
  .help-left, .help-right { padding: 8px 20px !important; }
  .help-divider { display: none !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#050505;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;margin:0;padding:24px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-wrap" width="760" cellspacing="0" cellpadding="0" style="width:760px;max-width:760px;background:#ffffff;border:1px solid #e7ddd2;border-radius:5px;overflow:hidden;box-shadow:0 8px 28px rgba(39,24,8,.08);">
          <tr>
            <td style="background:#987b58;padding:24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="brand-left" align="left" style="vertical-align:middle;">
                    <div style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:30px;letter-spacing:5px;line-height:34px;">JEBAL</div>
                    <div style="color:#ffffff;font-size:10px;letter-spacing:5px;margin-top:3px;">GUEST HOUSE</div>
                    <div style="color:#f0c17c;font-size:11px;letter-spacing:1.5px;margin-top:10px;">— ADMIN VERIFICATION —</div>
                  </td>
                  <td class="alert-right" align="right" style="vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" align="right">
                      <tr>
                        <td style="width:52px;height:52px;border-radius:18px;background:linear-gradient(135deg,#c38a39,#987b58);color:#ffffff;text-align:center;font-size:11px;line-height:52px;">' . booking_email_icon('lock') . '</td>
                        <td style="padding-left:14px;color:#ffffff;text-align:left;">
                          <div style="font-weight:800;font-size:15px;line-height:21px;">Security Alert</div>
                          <div style="font-size:14px;line-height:20px;color:#ffffff;">Admin Verification</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:36px 68px 28px;background:#ffffff;">
              <div align="center">
                <div class="hero-icon" style="width:96px;height:96px;border-radius:50%;background:#f7f4ef;color:#987b58;text-align:center;line-height:96px;font-size:30px;margin:0 auto 22px;">' . booking_email_icon('mail') . '</div>
                <h1 class="title" style="margin:0 0 18px;font-size:29px;line-height:36px;font-weight:900;color:#050505;">Admin Verification Code</h1>
                <p style="margin:0 0 6px;font-size:16px;line-height:24px;color:#050505;">Hello Admin,</p>
                <p style="margin:0 auto 26px;max-width:430px;font-size:16px;line-height:25px;color:#050505;">Use the OTP code below to verify your identity and access the admin dashboard.</p>

                <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="width:520px;max-width:100%;border:1px solid #e3d8cc;border-radius:9px;background:#ffffff;margin:0 auto 24px;">
                  <tr>
                    <td class="otp-box" align="center" style="padding:20px 18px 17px;">
                      <div style="font-size:16px;color:#050505;margin-bottom:16px;">Your OTP Code</div>
                      <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
                        <tr>' . $digitsHtml . '</tr>
                      </table>
                      <p style="margin:22px 0 0;font-size:17px;line-height:24px;color:#050505;">This code will expire in <strong style="color:#987b58;">' . email_safe($minutesText) . '</strong>.</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" class="security-table" width="610" cellspacing="0" cellpadding="0" style="width:610px;max-width:100%;border:1px solid #e3d8cc;border-radius:9px;background:#ffffff;margin:0 auto 28px;">
                  <tr>
                    <td class="security-icon" width="70" align="center" style="padding:20px 10px 20px 24px;vertical-align:top;color:#987b58;font-size:30px;">' . booking_email_icon('security') . '</td>
                    <td class="security-copy" style="padding:20px 24px 20px 6px;text-align:left;">
                      <div style="font-size:16px;font-weight:800;color:#050505;margin-bottom:6px;">For your security</div>
                      <div style="font-size:14px;line-height:22px;color:#050505;">Do not share this code with anyone.<br>If you did not request this code, please ignore this email.</div>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="height:1px;background:#e4d9cc;margin:0 0 28px;"></div>

              <table role="presentation" class="help-table" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="help-left" width="44%" style="padding:8px 20px 8px 36px;vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:64px;height:64px;border-radius:50%;background:#f7f4ef;color:#987b58;text-align:center;line-height:64px;font-size:30px;">' . booking_email_icon('headset', 24) . '</td>
                        <td style="padding-left:18px;">
                          <div style="font-size:18px;font-weight:900;color:#050505;margin-bottom:4px;">Need help?</div>
                          <div style="font-size:14px;line-height:20px;color:#050505;">If you have any issues,<br>contact our support team.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="help-divider" width="1" style="background:#e4d9cc;"></td>
                  <td class="help-right" style="padding:8px 10px 8px 42px;vertical-align:middle;">
                    <div style="font-size:15px;line-height:28px;color:#050505;"><span style="color:#987b58;">' . booking_email_icon('phone') . '</span>&nbsp;&nbsp; ' . email_safe(email_contact_phone()) . '</div>
                    <div style="font-size:15px;line-height:28px;color:#050505;"><span style="color:#987b58;">' . booking_email_icon('mail') . '</span>&nbsp;&nbsp; ' . email_safe(email_contact_email()) . '</div>
                    <div style="font-size:15px;line-height:28px;color:#050505;"><span style="color:#987b58;">' . booking_email_icon('web') . '</span>&nbsp;&nbsp; ' . email_safe(email_contact_website()) . '</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #eee6dc;padding:21px 20px 25px;">
              <div style="font-size:15px;line-height:24px;color:#6b7280;">This is an automated email. Please do not reply.</div>
              <div style="font-size:15px;line-height:24px;color:#6b7280;">&copy; ' . $year . ' Jebal Guest House. All rights reserved.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';
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


function booking_email_icon(string $icon, int $size = 24): string
{
    $validIcons = array_keys(email_icon_file_map());
    $name = in_array($icon, $validIcons, true) ? $icon : 'info';
    $size = max(14, min(36, $size));

    return '<img src="cid:jebal-email-icon-' . email_safe($name) . '" width="' . $size . '" height="' . $size . '" alt="" style="display:inline-block;width:' . $size . 'px;height:' . $size . 'px;border:0;outline:none;text-decoration:none;vertical-align:-0.18em;line-height:1;">';
}

function booking_email_status_config(string $status): array
{
    $key = strtolower(trim($status));

    $map = [
        'confirmed' => ['Booking Confirmed!', 'Your booking and payment were successful. We look forward to welcoming you.', 'Payment Status: Paid', 'check', '#0f7a24', '#e9f9ea'],
        'paid' => ['Booking Confirmed!', 'Your booking and payment were successful. We look forward to welcoming you.', 'Payment Status: Paid', 'check', '#0f7a24', '#e9f9ea'],
        'pending' => ['Booking Received', 'We received your booking details. Your booking is waiting for payment confirmation.', 'Payment Status: Pending', 'calendar', '#987b58', '#ffffff'],
        'received' => ['Booking Received', 'We received your booking inquiry. Our team will contact you if any detail needs confirmation.', 'Booking Status: Received', 'calendar', '#987b58', '#ffffff'],
        'failed' => ['Payment Failed', 'Your payment could not be completed. You can retry payment if the room is still available.', 'Payment Status: Failed', 'close', '#b42318', '#fff1f1'],
        'expired' => ['Booking Hold Expired', 'Your booking hold expired because payment was not completed within the allowed time.', 'Booking Status: Expired', 'alert', '#b42318', '#fff1f1'],
        'cancelled' => ['Booking Cancelled', 'Your booking has been cancelled. Contact us if this was unexpected.', 'Booking Status: Cancelled', 'close', '#b42318', '#fff1f1'],
        'updated' => ['Booking Updated', 'Your booking details have been updated.', 'Booking Status: Updated', 'info', '#987b58', '#ffffff'],
        'admin' => ['Booking Notification', 'A booking update was received from the website.', 'Hotel Notification', 'info', '#987b58', '#ffffff'],
    ];

    return $map[$key] ?? $map['updated'];
}

function booking_email_company_block(): string
{
    return '<div style="background:#ffffff;border-top:1px solid #eadfd2;border-bottom:1px solid #eadfd2;padding:22px 34px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
                <td style="width:43%;vertical-align:middle;padding:0 24px 0 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:58px;height:58px;border-radius:50%;background:#f7f4ef;text-align:center;vertical-align:middle;color:#987b58;font-size:28px;font-weight:700;">' . booking_email_icon('headset', 24) . '</td>
                            <td style="padding-left:18px;">
                                <div style="font-size:18px;font-weight:800;color:#111;line-height:1.2;">Need help?</div>
                                <div style="font-size:14px;color:#111;margin-top:4px;">We\'re here for you.</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width:1px;background:#d7c8b9;"></td>
                <td style="vertical-align:middle;padding-left:34px;color:#333;font-size:14px;line-height:1.8;">
                    <div><span style="color:#987b58;width:24px;display:inline-block;">' . booking_email_icon('mail') . '</span> ' . email_safe(email_contact_email()) . '</div>
                    <div><span style="color:#987b58;width:24px;display:inline-block;">' . booking_email_icon('phone') . '</span> ' . email_safe(email_contact_phone()) . '</div>
                    <div><span style="color:#987b58;width:24px;display:inline-block;">' . booking_email_icon('web') . '</span> ' . email_safe(email_contact_website()) . '</div>
                </td>
            </tr>
        </table>
    </div>';
}

function booking_email_shell(string $content, string $preheader = ''): string
{
    $brand = email_safe(email_brand_name());
    $year = date('Y');
    $date = date('d F Y');
    $time = date('h:i A');

    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $brand . '</title>' . email_icon_font_css() . '</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . email_safe($preheader) . '</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#ffffff;padding:24px 0;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="760" cellspacing="0" cellpadding="0" style="width:760px;max-width:100%;border-collapse:collapse;background:#ffffff;border-radius:6px;box-shadow:0 14px 38px rgba(20,20,20,.08);overflow:hidden;">
<tr><td style="padding:28px 34px 20px;border-bottom:2px solid #987b58;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr>
        <td align="left" style="text-align:left;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:30px;letter-spacing:7px;color:#987b58;font-weight:700;line-height:1;">JEBAL</div>
            <div style="font-size:14px;letter-spacing:5px;color:#987b58;font-weight:700;margin-top:6px;">GUEST HOUSE</div>
            <div style="font-size:14px;color:#987b58;margin-top:10px;"><span style="display:inline-block;width:58px;border-top:1px solid #c9a77d;vertical-align:middle;margin-right:12px;"></span>Comfortable Guest House<span style="display:inline-block;width:58px;border-top:1px solid #c9a77d;vertical-align:middle;margin-left:12px;"></span></div>
        </td>
        <td align="right" style="width:150px;color:#333;font-size:13px;line-height:1.45;vertical-align:top;">' . booking_email_icon('calendar') . ' &nbsp;' . email_safe($date) . '<br><span style="padding-left:28px;">' . email_safe($time) . '</span></td>
    </tr></table>
</td></tr>
<tr><td style="padding:34px 58px 26px;">' . $content . '</td></tr>
<tr><td>' . booking_email_company_block() . '</td></tr>
<tr><td style="padding:20px 30px 24px;text-align:center;border-top:1px solid #eee;color:#111;font-size:14px;line-height:1.5;">
    <div>Thank you for choosing Jebal Guest House.</div>
    <div style="margin:10px auto;color:#987b58;"><span style="display:inline-block;width:34px;border-top:1px solid #c9a77d;vertical-align:middle;margin-right:10px;"></span><span style="display:inline-block;width:34px;border-top:1px solid #c9a77d;vertical-align:middle;margin-left:10px;"></span></div>
    <div style="color:#333;">&copy; ' . $year . ' Jebal Guest House. All rights reserved.</div>
</td></tr>
</table>
</td></tr></table>
</body></html>';
}

function booking_email_reference_panel(array $booking): string
{
    $ref = booking_reference($booking);
    $invoice = booking_invoice_number($booking);

    if ($invoice === '') {
        $invoice = '-';
    }

    return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:22px 0 16px;border:1px solid #eadfd2;border-radius:8px;background:#ffffff;overflow:hidden;">
        <tr>
            <td align="center" style="width:50%;padding:18px 12px;color:#666;font-size:13px;">Booking Reference<br><strong style="display:block;margin-top:8px;color:#987b58;font-size:18px;letter-spacing:.3px;">' . email_safe($ref) . '</strong></td>
            <td style="width:1px;background:#d7c8b9;"></td>
            <td align="center" style="width:50%;padding:18px 12px;color:#666;font-size:13px;">Invoice Number<br><strong style="display:block;margin-top:8px;color:#987b58;font-size:18px;letter-spacing:.3px;">' . email_safe($invoice) . '</strong></td>
        </tr>
    </table>';
}

function booking_email_info_box(string $title, string $icon, array $rows, string $highlight = ''): string
{
    $body = '';
    foreach ($rows as $label => $value) {
        if ($value === null || $value === '') {
            continue;
        }
        $body .= '<tr><td style="padding:8px 0;color:#444;font-size:14px;">' . email_safe((string) $label) . '</td><td align="right" style="padding:8px 0;color:#111;font-size:14px;font-weight:700;">' . email_safe((string) $value) . '</td></tr>';
    }

    return '<td width="50%" style="width:50%;vertical-align:top;padding:0 10px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #eadfd2;border-radius:8px;background:#fff;overflow:hidden;">
            <tr><td style="padding:20px 20px 8px;">
                <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:38px;height:38px;border-radius:50%;background:#f7f4ef;text-align:center;color:#987b58;font-size:20px;">' . booking_email_icon($icon) . '</td><td style="padding-left:12px;font-size:18px;font-weight:800;color:#111;">' . email_safe($title) . '</td></tr></table>
                ' . ($highlight !== '' ? '<div style="margin-top:18px;font-size:20px;font-weight:800;color:#987b58;">' . email_safe($highlight) . '</div>' : '') . '
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;border-top:1px solid #eadfd2;">' . $body . '</table>
            </td></tr>
        </table>
    </td>';
}

function customer_booking_confirmation_email_html(array $booking, string $viewUrl = ''): string
{
    $brand = email_safe(email_brand_name());
    $guestName = trim((string) ($booking['full_name'] ?? $booking['guest_name'] ?? 'Guest'));
    $bookingRef = booking_reference($booking);

    $checkInRaw = trim((string) ($booking['check_in_date'] ?? ''));
    $checkOutRaw = trim((string) ($booking['check_out_date'] ?? ''));
    $checkIn = $checkInRaw !== '' ? reminder_email_format_date($checkInRaw) : '-';
    $checkOut = $checkOutRaw !== '' ? reminder_email_format_date($checkOutRaw) : '-';

    $guestCount = (int) ($booking['guests'] ?? 0);
    $guests = $guestCount > 0 ? $guestCount . ($guestCount === 1 ? ' Guest' : ' Guests') : '-';
    $roomType = trim((string) ($booking['room_name'] ?? $booking['room_type'] ?? ''));
    $amountValue = $booking['amount'] ?? $booking['total_amount'] ?? null;
    $amount = ($amountValue !== null && $amountValue !== '')
        ? format_money_amount((float) $amountValue)
        : '-';

    $phone = email_contact_phone();
    $email = email_contact_email();
    $website = email_contact_website();
    $year = date('Y');

    if ($viewUrl === '') {
        $viewUrl = email_public_url();
    }

    $detailRows = [
        'Booking ID' => $bookingRef,
        'Check-in' => $checkIn,
        'Check-out' => $checkOut,
        'Guests' => $guests,
        'Room Type' => $roomType !== '' ? $roomType : '-',
        'Total Amount' => $amount,
    ];

    $rowsHtml = '';
    $rowCount = count($detailRows);
    $rowIndex = 0;
    foreach ($detailRows as $label => $value) {
        $border = $rowIndex < $rowCount - 1 ? 'border-bottom:1px solid #e2e5ea;' : '';
        $rowsHtml .= '<tr>
            <td class="detail-label" style="width:31%;padding:11px 16px;color:#07152f;font-size:14px;line-height:1.4;' . $border . '">' . email_safe($label) . '</td>
            <td class="detail-colon" style="width:7%;padding:11px 4px;color:#07152f;font-size:14px;line-height:1.4;text-align:center;' . $border . '">:</td>
            <td class="detail-value" style="width:62%;padding:11px 16px;color:#07152f;font-size:14px;line-height:1.4;' . $border . '">' . email_safe((string) $value) . '</td>
        </tr>';
        $rowIndex++;
    }

    $buttonHtml = $viewUrl !== ''
        ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" class="button-table" style="margin:24px auto 28px;">
            <tr><td align="center" bgcolor="#071b52" style="border-radius:4px;background:#071b52;">
                <a href="' . email_safe($viewUrl) . '" class="view-button" style="display:inline-block;min-width:190px;padding:13px 28px;color:#ffffff;font-size:14px;line-height:1.2;font-weight:700;text-decoration:none;text-align:center;border-radius:4px;box-sizing:border-box;">View Booking</a>
            </td></tr>
        </table>'
        : '';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booking Confirmed - ' . $brand . '</title>' . email_icon_font_css() . '
<style>
@media only screen and (max-width: 680px) {
  .outer-pad { padding:18px 12px !important; }
  .email-wrap { width:100% !important; max-width:100% !important; }
  .email-pad { padding-left:28px !important; padding-right:28px !important; }
  .header-title { font-size:19px !important; }
  .header-tagline { font-size:13px !important; }
  .browser-link { font-size:12px !important; }
  .support-item { display:block !important; width:100% !important; padding:5px 0 !important; }
  .footer-pad { padding-left:20px !important; padding-right:20px !important; }
}
@media only screen and (max-width: 460px) {
  .outer-pad { padding:0 !important; }
  .email-wrap { border-left:1px solid #dfe3e8 !important; border-right:1px solid #dfe3e8 !important; }
  .email-pad { padding-left:20px !important; padding-right:20px !important; }
  .header-brand { text-align:center !important; }
  .browser-link-cell { display:none !important; }
  .header-title { font-size:18px !important; }
  .header-tagline { font-size:13px !important; }
  .content-text { font-size:13px !important; line-height:1.5 !important; }
  .detail-label { width:52% !important; padding:10px 10px !important; font-size:13px !important; }
  .detail-colon { display:none !important; width:0 !important; padding:0 !important; font-size:0 !important; }
  .detail-value { width:48% !important; padding:10px 10px !important; font-size:13px !important; text-align:left !important; }
  .info-icon-cell { width:32px !important; padding-left:10px !important; }
  .info-copy { padding-right:10px !important; }
  .button-table { width:100% !important; margin-top:12px !important; margin-bottom:20px !important; }
  .button-table td { width:100% !important; }
  .view-button { display:block !important; width:100% !important; min-width:0 !important; padding-left:12px !important; padding-right:12px !important; }
  .footer-text-line { display:block !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#07152f;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your booking has been confirmed. We look forward to welcoming you.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#f6f7f9;border-collapse:collapse;">
<tr><td class="outer-pad" align="center" style="padding:28px 16px;">
<table class="email-wrap" role="presentation" cellpadding="0" cellspacing="0" border="0" width="650" style="width:650px;max-width:100%;background:#ffffff;border:1px solid #dfe3e8;border-collapse:collapse;">
<tr><td class="email-pad" style="padding:24px 38px 18px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td class="header-brand" valign="top">
      <div class="header-title" style="font-size:21px;line-height:1.25;font-weight:700;color:#07152f;">' . $brand . '</div>
      <div class="header-tagline" style="margin-top:5px;font-size:14px;line-height:1.4;color:#374151;">A Clean and Comfortable Stay</div>
    </td>
    <td class="browser-link-cell" align="right" valign="middle" style="white-space:nowrap;padding-left:14px;">
      <a class="browser-link" href="' . email_safe($viewUrl) . '" style="font-size:12px;line-height:1.4;color:#071b52;text-decoration:none;">View in browser</a>
    </td>
  </tr></table>
</td></tr>
<tr><td class="email-pad" style="padding:0 38px;"><div style="height:1px;background:#d9dde3;font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td class="email-pad" style="padding:26px 38px 24px;">
  <p style="margin:0 0 17px;font-size:16px;line-height:1.4;font-weight:700;color:#07152f;">Hi ' . email_safe($guestName !== '' ? $guestName : 'Guest') . ',</p>
  <p class="content-text" style="margin:0 0 23px;font-size:14px;line-height:1.55;color:#07152f;">Thank you for choosing ' . $brand . '.<br>Your booking has been confirmed. We look forward to welcoming you!</p>

  <h2 style="margin:0 0 13px;font-size:17px;line-height:1.3;font-weight:700;color:#07152f;">Booking Details</h2>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:1px solid #d8dde5;border-radius:4px;border-collapse:separate;border-spacing:0;overflow:hidden;">' . $rowsHtml . '</table>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin-top:18px;background:#f1f6fd;border:1px solid #cbdcf4;border-radius:5px;border-collapse:separate;border-spacing:0;">
    <tr>
      <td class="info-icon-cell" valign="top" style="width:36px;padding:15px 0 15px 16px;">' . booking_email_icon('info', 22) . '</td>
      <td class="info-copy" style="padding:14px 16px 14px 10px;">
        <div style="font-size:14px;line-height:1.4;font-weight:700;color:#10234b;">Important Information</div>
        <div class="content-text" style="margin-top:7px;font-size:13px;line-height:1.55;color:#07152f;">You can modify or cancel your booking up to 24 hours before check-in.<br>If you have any questions, feel free to contact us.</div>
      </td>
    </tr>
  </table>

  ' . $buttonHtml . '

  <div style="height:1px;background:#d9dde3;font-size:0;line-height:0;">&nbsp;</div>
  <div style="padding-top:22px;">
    <div style="font-size:13px;line-height:1.4;font-weight:700;color:#07152f;margin-bottom:12px;">Need help?</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td class="support-item" style="width:31%;font-size:12px;line-height:1.5;color:#10234b;vertical-align:top;">' . booking_email_icon('phone', 17) . '&nbsp;&nbsp;' . email_safe($phone) . '</td>
      <td class="support-item" style="width:38%;font-size:12px;line-height:1.5;color:#10234b;vertical-align:top;">' . booking_email_icon('mail', 17) . '&nbsp;&nbsp;' . email_safe($email) . '</td>
      <td class="support-item" style="width:31%;font-size:12px;line-height:1.5;color:#10234b;vertical-align:top;">' . booking_email_icon('web', 17) . '&nbsp;&nbsp;' . email_safe($website) . '</td>
    </tr></table>
  </div>
</td></tr>
<tr><td class="footer-pad" align="center" style="padding:20px 30px;background:#f7f8fa;border-top:1px solid #e2e5e9;color:#4b5563;font-size:12px;line-height:1.5;">&copy; ' . $year . ' ' . $brand . '. <span class="footer-text-line">All rights reserved.</span></td></tr>
</table>
</td></tr></table>
</body>
</html>';
}


function admin_booking_received_email_html(array $booking): string
{
    $brand = email_safe(email_brand_name());
    $year = date('Y');
    $dashboardUrl = reminder_email_admin_dashboard_url();
    $phone = email_contact_phone();
    $email = email_contact_email();
    $website = email_contact_website();

    $bookingId = booking_reference($booking);
    $guestName = booking_guest_name($booking);
    $checkInRaw = trim((string) ($booking['check_in_date'] ?? ''));
    $checkOutRaw = trim((string) ($booking['check_out_date'] ?? ''));
    $checkIn = $checkInRaw !== '' ? reminder_email_format_date($checkInRaw) : '-';
    $checkOut = $checkOutRaw !== '' ? reminder_email_format_date($checkOutRaw) : '-';
    $guestsCount = trim((string) ($booking['guests'] ?? ''));
    $guests = $guestsCount !== '' ? $guestsCount . ((int) $guestsCount === 1 ? ' Guest' : ' Guests') : '-';
    $room = trim((string) ($booking['room_name'] ?? $booking['room_type'] ?? ''));
    $amountValue = $booking['amount'] ?? $booking['total_amount'] ?? null;
    $amount = ($amountValue !== null && $amountValue !== '') ? format_money_amount((float) $amountValue) : '-';

    $rows = [
        'Booking ID' => $bookingId,
        'Guest Name' => $guestName,
        'Check-in' => $checkIn,
        'Check-out' => $checkOut,
        'Guests' => $guests,
        'Room Type' => $room !== '' ? $room : '-',
        'Total Amount' => $amount,
    ];

    $rowsHtml = '';
    $lastIndex = count($rows) - 1;
    foreach (array_values($rows) as $index => $value) {
        $label = array_keys($rows)[$index];
        $border = $index < $lastIndex ? 'border-bottom:1px solid #e3e6eb;' : '';
        $rowsHtml .= '<tr>
          <td class="booking-label" style="width:31%;padding:11px 16px;font-size:14px;line-height:1.35;color:#111827;' . $border . '">' . email_safe($label) . '</td>
          <td class="booking-colon" style="width:24px;padding:11px 4px;text-align:center;font-size:14px;line-height:1.35;color:#111827;' . $border . '">:</td>
          <td class="booking-value" style="padding:11px 16px;font-size:14px;line-height:1.35;color:#111827;' . $border . '">' . email_safe((string) $value) . '</td>
        </tr>';
    }

    $button = $dashboardUrl !== ''
        ? '<a href="' . email_safe($dashboardUrl) . '" class="dashboard-button" style="display:inline-block;min-width:280px;padding:13px 24px;background:#071b52;color:#ffffff;border-radius:5px;font-size:14px;line-height:1.3;font-weight:800;text-align:center;text-decoration:none;box-sizing:border-box;">View Booking in Dashboard</a>'
        : '<span class="dashboard-button" style="display:inline-block;min-width:280px;padding:13px 24px;background:#071b52;color:#ffffff;border-radius:5px;font-size:14px;line-height:1.3;font-weight:800;text-align:center;box-sizing:border-box;">View Booking in Dashboard</span>';

    return '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Booking Received</title>' . email_icon_font_css() . '
<style>
@media only screen and (max-width: 680px) {
  .outer-pad { padding:18px 12px !important; }
  .email-wrap { width:100% !important; }
  .email-pad { padding-left:28px !important; padding-right:28px !important; }
  .hero-icon-cell { width:74px !important; padding-right:18px !important; }
  .hero-icon { width:58px !important; height:58px !important; }
  .hero-title { font-size:23px !important; }
  .support-item { display:block !important; width:100% !important; padding:5px 0 !important; }
}
@media only screen and (max-width: 460px) {
  .outer-pad { padding:0 !important; }
  .email-wrap { border-left:1px solid #dfe3e8 !important; border-right:1px solid #dfe3e8 !important; }
  .email-pad { padding-left:20px !important; padding-right:20px !important; }
  .browser-link { display:none !important; }
  .header-brand { text-align:center !important; }
  .header-brand-cell { display:block !important; width:100% !important; text-align:center !important; }
  .hero-icon-cell { width:48px !important; padding-right:12px !important; }
  .hero-icon { width:44px !important; height:44px !important; }
  .hero-icon img { width:23px !important; height:23px !important; }
  .hero-title { font-size:19px !important; line-height:1.28 !important; }
  .hero-copy { font-size:13px !important; line-height:1.55 !important; }
  .booking-colon { display:none !important; }
  .booking-label { width:42% !important; padding:10px 8px !important; font-size:13px !important; }
  .booking-value { padding:10px 8px !important; font-size:13px !important; text-align:left !important; }
  .dashboard-button { display:block !important; width:100% !important; min-width:0 !important; }
  .info-icon-cell { width:33px !important; padding-left:12px !important; }
  .info-copy { padding-right:12px !important; }
  .footer-pad { padding-left:18px !important; padding-right:18px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A new booking has been received.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background:#f7f8fa;border-collapse:collapse;">
<tr><td class="outer-pad" align="center" style="padding:28px 16px;">
<table class="email-wrap" role="presentation" cellpadding="0" cellspacing="0" border="0" width="650" style="width:650px;max-width:100%;background:#ffffff;border:1px solid #dfe3e8;border-collapse:collapse;">
<tr><td class="email-pad" style="padding:24px 38px 18px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td class="header-brand-cell" valign="top">
      <div class="header-brand" style="font-size:21px;line-height:1.25;font-weight:700;color:#07152f;">' . $brand . '</div>
      <div style="margin-top:5px;font-size:14px;line-height:1.4;color:#374151;">A Clean and Comfortable Stay</div>
    </td>
    <td align="right" valign="middle" style="white-space:nowrap;padding-left:14px;">
      <a class="browser-link" href="' . email_safe(email_public_url()) . '" style="font-size:12px;line-height:1.4;color:#071b52;text-decoration:none;">View in browser</a>
    </td>
  </tr></table>
</td></tr>
<tr><td class="email-pad" style="padding:0 38px;"><div style="height:1px;background:#d9dde3;font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td class="email-pad" style="padding:24px 38px 30px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
    <td class="hero-icon-cell" valign="top" style="width:78px;padding-right:20px;">
      <table class="hero-icon" role="presentation" cellpadding="0" cellspacing="0" border="0" width="68" height="68" style="width:68px;height:68px;border-radius:50%;background:#f0f5fd;"><tr><td align="center" valign="middle" style="text-align:center;">' . booking_email_icon('calendar', 32) . '</td></tr></table>
    </td>
    <td valign="middle">
      <h1 class="hero-title" style="margin:0 0 12px;font-size:25px;line-height:1.25;font-weight:800;color:#07152f;">New Booking Received</h1>
      <p class="hero-copy" style="margin:0;font-size:14px;line-height:1.55;color:#111827;">You have received a new booking. Please find the details below.</p>
    </td>
  </tr></table>

  <h2 style="margin:28px 0 14px;font-size:16px;line-height:1.3;font-weight:800;color:#111827;">Booking Details</h2>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:1px solid #d8dde5;border-radius:5px;border-collapse:separate;border-spacing:0;overflow:hidden;">' . $rowsHtml . '</table>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin-top:18px;background:#f1f6fd;border:1px solid #cbdcf4;border-radius:5px;border-collapse:separate;border-spacing:0;">
    <tr>
      <td class="info-icon-cell" valign="top" style="width:38px;padding:16px 0 16px 16px;"><div style="width:22px;height:22px;border-radius:50%;background:#1e5fa8;color:#ffffff;font-size:14px;line-height:22px;font-weight:700;text-align:center;">i</div></td>
      <td class="info-copy" style="padding:15px 16px 15px 10px;">
        <div style="font-size:14px;line-height:1.4;font-weight:800;color:#10234b;">Important Information</div>
        <div style="margin-top:7px;font-size:13px;line-height:1.55;color:#111827;">Please review the booking and prepare for the guest\'s arrival.</div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;margin:30px 0 28px;">' . $button . '</div>
  <div style="height:1px;background:#d9dde3;font-size:0;line-height:0;">&nbsp;</div>
  <div style="padding-top:22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td class="support-item" style="width:31%;font-size:12px;line-height:1.5;color:#10234b;vertical-align:top;">' . booking_email_icon('phone', 17) . '&nbsp;&nbsp;' . email_safe($phone) . '</td>
      <td class="support-item" style="width:38%;font-size:12px;line-height:1.5;color:#10234b;vertical-align:top;">' . booking_email_icon('mail', 17) . '&nbsp;&nbsp;' . email_safe($email) . '</td>
      <td class="support-item" style="width:31%;font-size:12px;line-height:1.5;color:#10234b;vertical-align:top;">' . booking_email_icon('web', 17) . '&nbsp;&nbsp;' . email_safe($website) . '</td>
    </tr></table>
  </div>
</td></tr>
<tr><td class="footer-pad" align="center" style="padding:20px 30px;background:#f7f8fa;border-top:1px solid #e2e5e9;color:#4b5563;font-size:12px;line-height:1.5;">&copy; ' . $year . ' ' . $brand . '. All rights reserved.</td></tr>
</table>
</td></tr></table>
</body>
</html>';
}

function booking_email_html(string $state, array $booking, array $payment = [], bool $admin = false, string $extraButton = '', array $extraRows = [], string $customHeading = '', string $customMessage = '', string $customBadge = ''): string
{
    if (!$admin && strtolower($state) === 'confirmed' && $customHeading === '' && $customMessage === '' && $customBadge === '') {
        return customer_booking_confirmation_email_html($booking, email_public_url());
    }

    $cfg = $admin ? booking_email_status_config('admin') : booking_email_status_config($state);
    [$heading, $message, $badge, $icon, $badgeColor, $badgeBg] = $cfg;

    if ($admin) {
        $heading = $heading . ': ' . booking_reference($booking);
        $message = $message . ' Review the details below.';
        $badge = match (strtolower($state)) {
            'confirmed', 'paid' => 'Payment Received',
            'pending', 'received' => 'Payment Pending',
            'failed' => 'Payment Failed',
            'expired' => 'Booking Expired',
            'cancelled' => 'Booking Cancelled',
            default => 'Booking Updated',
        };
    }

    if ($customHeading !== '') {
        $heading = $customHeading;
    }
    if ($customMessage !== '') {
        $message = $customMessage;
    }
    if ($customBadge !== '') {
        $badge = $customBadge;
    }

    $guestName = $admin ? ($booking['full_name'] ?? $booking['guest_name'] ?? 'Guest') : ($booking['full_name'] ?? 'Guest');
    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $paymentMethod = $payment['payment_method'] ?? $payment['method'] ?? ($payment ? 'PayHere' : '-');
    $transaction = $payment['transaction_id'] ?? $payment['payment_id'] ?? $payment['order_id'] ?? '';
    $dates = trim((string) ($booking['check_in_date'] ?? '') . ' - ' . (string) ($booking['check_out_date'] ?? ''));

    $stayRows = [
        'Room Type' => $booking['room_name'] ?? '',
        'Check-in' => $booking['check_in_date'] ?? '',
        'Check-out' => $booking['check_out_date'] ?? '',
        'Guests' => !empty($booking['guests']) ? ((string) $booking['guests'] . ' Guests') : '',
    ];

    if ($admin) {
        $stayRows = array_merge([
            'Guest Name' => booking_guest_name($booking),
            'Booked By' => $booking['full_name'] ?? $booking['guest_name'] ?? '',
            'Phone' => $booking['phone'] ?? '',
            'Email' => $booking['email'] ?? '',
        ], $stayRows);
    }

    $paymentRows = [
        'Payment Method' => $paymentMethod,
        'Transaction ID' => $transaction,
        'Payment Status' => status_label_for_email($booking['payment_status'] ?? $payment['status'] ?? $state),
    ];

    if ($extraRows) {
        $paymentRows = array_merge($paymentRows, $extraRows);
    }

    $content = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr>
        <td style="width:170px;vertical-align:top;text-align:center;padding-top:8px;">
            <div style="width:92px;height:92px;border-radius:50%;border:10px solid #f7f4ef;background:#987b58;color:#ffffff;font-size:13px;line-height:92px;text-align:center;margin:0 auto;font-weight:800;">' . booking_email_icon($icon, 32) . '</div>
        </td>
        <td style="vertical-align:top;padding-left:18px;">
            <h1 style="margin:0 0 16px;color:#2a190b;font-size:30px;line-height:1.15;font-weight:800;">' . email_safe($heading) . '</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#111;">Hi ' . email_safe((string) $guestName) . ',</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#111;">' . email_safe($message) . '</p>
            <div style="display:inline-block;border-radius:22px;background:' . $badgeBg . ';color:' . $badgeColor . ';font-size:13px;font-weight:800;padding:9px 16px;">' . booking_email_icon($icon) . ' &nbsp;' . email_safe($badge) . '</div>
        </td>
    </tr></table>';

    $content .= booking_email_reference_panel($booking);
    $content .= '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 -10px;"><tr>'
        . booking_email_info_box('Stay Details', 'bed', $stayRows)
        . booking_email_info_box('Payment Summary', 'wallet', $paymentRows, $amount)
        . '</tr></table>';

    if ($extraButton !== '') {
        $content .= '<div style="text-align:center;margin:10px 0 0;">' . $extraButton . '</div>';
    }

    return booking_email_shell($content, $message);
}


function booking_staying_guest_email(array $booking): string
{
    $isOther = !empty($booking['is_booking_for_other']) && (int) $booking['is_booking_for_other'] === 1;
    $email = strtolower(trim((string) ($booking['staying_guest_email'] ?? '')));
    $bookerEmail = strtolower(trim((string) ($booking['email'] ?? '')));

    if (!$isOther || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return '';
    }

    if ($bookerEmail !== '' && $email === $bookerEmail) {
        return '';
    }

    return $email;
}

function booking_staying_guest_name(array $booking): string
{
    $name = trim((string) ($booking['staying_guest_name'] ?? ''));
    return $name !== '' ? $name : 'Guest';
}

function booking_staying_guest_email_booking(array $booking): array
{
    $guestBooking = $booking;
    $guestBooking['full_name'] = booking_staying_guest_name($booking);
    $guestBooking['email'] = booking_staying_guest_email($booking);
    $guestBooking['phone'] = trim((string) ($booking['staying_guest_phone'] ?? ''));
    return $guestBooking;
}

function booking_staying_guest_intro(array $booking): string
{
    $bookerName = trim((string) ($booking['full_name'] ?? $booking['booker_name'] ?? ''));
    if ($bookerName === '') {
        $bookerName = 'Someone';
    }

    return $bookerName . ' booked a room for you at Jebal Guest House. Your booking details are below.';
}

function send_staying_guest_booking_email(PDO $pdo, array $booking, string $state, array $payment = [], string $emailType = 'staying_guest_booking_notification', string $subjectPrefix = 'Room booked for you'): bool
{
    $bookingId = (int) ($booking['id'] ?? 0);
    $guestEmail = booking_staying_guest_email($booking);

    if ($bookingId < 1 || $guestEmail === '') {
        return false;
    }

    if (booking_email_sent($pdo, $bookingId, [$emailType])) {
        return true;
    }

    $guestBooking = booking_staying_guest_email_booking($booking);
    $bookerName = trim((string) ($booking['full_name'] ?? $booking['booker_name'] ?? ''));
    $bookerPhone = trim((string) ($booking['phone'] ?? $booking['booker_phone'] ?? ''));
    $bookerEmail = trim((string) ($booking['email'] ?? $booking['booker_email'] ?? ''));

    $extraRows = [];
    if ($bookerName !== '') {
        $extraRows['Booked By'] = $bookerName;
    }
    if ($bookerPhone !== '') {
        $extraRows['Booker Phone'] = $bookerPhone;
    }
    if ($bookerEmail !== '') {
        $extraRows['Booker Email'] = $bookerEmail;
    }

    $body = booking_email_html(
        $state,
        $guestBooking,
        $payment,
        false,
        '',
        $extraRows,
        'Room Booked For You',
        booking_staying_guest_intro($booking),
        'Booking Details'
    );

    return send_tracked_email(
        $pdo,
        'booking',
        $bookingId,
        $guestEmail,
        $subjectPrefix . ' - Jebal Guest House #' . $bookingId,
        $body,
        $emailType,
        $bookerEmail !== '' ? $bookerEmail : null
    );
}

function queue_staying_guest_booking_email(PDO $pdo, array $booking, string $state, array $payment = [], string $emailType = 'staying_guest_booking_notification', string $subjectPrefix = 'Room booked for you'): bool
{
    $bookingId = (int) ($booking['id'] ?? 0);
    $guestEmail = booking_staying_guest_email($booking);

    if ($bookingId < 1 || $guestEmail === '' || booking_email_sent($pdo, $bookingId, [$emailType])) {
        return false;
    }

    $guestBooking = booking_staying_guest_email_booking($booking);
    $bookerName = trim((string) ($booking['full_name'] ?? $booking['booker_name'] ?? ''));
    $bookerPhone = trim((string) ($booking['phone'] ?? $booking['booker_phone'] ?? ''));
    $bookerEmail = trim((string) ($booking['email'] ?? $booking['booker_email'] ?? ''));

    $extraRows = [];
    if ($bookerName !== '') {
        $extraRows['Booked By'] = $bookerName;
    }
    if ($bookerPhone !== '') {
        $extraRows['Booker Phone'] = $bookerPhone;
    }
    if ($bookerEmail !== '') {
        $extraRows['Booker Email'] = $bookerEmail;
    }

    $body = booking_email_html(
        $state,
        $guestBooking,
        $payment,
        false,
        '',
        $extraRows,
        'Room Booked For You',
        booking_staying_guest_intro($booking),
        'Booking Details'
    );

    return enqueue_email(
        $pdo,
        'booking',
        $bookingId,
        $guestEmail,
        $subjectPrefix . ' - Jebal Guest House #' . $bookingId,
        $body,
        $emailType,
        $bookerEmail !== '' ? $bookerEmail : null,
        3,
        booking_from_email(),
        booking_from_name()
    );
}

function send_booking_received_emails(PDO $pdo, array $booking): void
{
    $bookingId = (int) ($booking['id'] ?? 0);
    $subjectCustomer = 'Booking inquiry received - Jebal Guest House #' . $bookingId;

    $bodyCustomer = booking_email_html('received', $booking);

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

    $bodyAdmin = admin_booking_received_email_html($booking);

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

    send_staying_guest_booking_email($pdo, $booking, 'received', [], 'staying_guest_booking_received', 'A room was booked for you');

    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
    }
}

function send_booking_confirmed_email(PDO $pdo, array $booking): void
{
    // Invoice download buttons are intentionally not included in booking emails.
    $invoiceLink = '';

    $bookingId = (int) ($booking['id'] ?? 0);
    $subject = 'Booking confirmed - Jebal Guest House #' . $bookingId;

    $body = booking_email_html('confirmed', $booking, [], false, $invoiceLink);

    $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), $subject, $body, 'booking_confirmed');
    send_staying_guest_booking_email($pdo, $booking, 'confirmed', [], 'staying_guest_booking_confirmed', 'Booking confirmed for you');
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
        $bodyCustomer = booking_email_html('pending', $booking, $payment, false, $billButton, [
            'Order ID' => $orderId !== '' ? $orderId : '-',
            'Amount Due' => $amount,
        ]);

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
        $bodyAdmin = booking_email_html('pending', $booking, $payment, true, $billButton, [
            'Order ID' => $orderId !== '' ? $orderId : '-',
        ]);

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
        $bodyCustomer = booking_email_html('expired', $booking);

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
        $bodyAdmin = booking_email_html('expired', $booking, [], true);

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

    $bodyCustomer = booking_email_html('cancelled', $booking);

    $sentCustomer = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), $subjectCustomer, $bodyCustomer, 'booking_cancelled');

    $bodyAdmin = booking_email_html('cancelled', $booking, [], true);

    send_tracked_email($pdo, 'booking', $bookingId, ADMIN_EMAIL, 'Booking cancelled - Jebal Guest House #' . $bookingId, $bodyAdmin, 'admin_booking_cancelled');

    if ($bookingId > 0) {
        update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
    }
}

function send_payment_success_emails(PDO $pdo, array $booking, array $payment): void
{
    // Invoice download buttons are intentionally not included in booking emails.
    $invoiceLink = '';
    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $bookingId = (int) ($booking['id'] ?? 0);

    $customerType = 'payment_successful';
    $adminType = 'admin_payment_received';

    if (!booking_email_sent($pdo, $bookingId, [$customerType])) {
        $bodyCustomer = booking_email_html('paid', $booking, $payment, false, $invoiceLink);

        $sentCustomer = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment successful - Jebal Guest House #' . $bookingId, $bodyCustomer, $customerType);
        if ($bookingId > 0) {
            update_booking_email_status($pdo, $bookingId, $sentCustomer ? 'Sent' : 'Failed');
        }
    }

    if (!booking_email_sent($pdo, $bookingId, [$adminType])) {
        $bodyAdmin = booking_email_html('paid', $booking, $payment, true);

        send_tracked_email($pdo, 'booking', $bookingId, ADMIN_EMAIL, 'Payment received - Jebal Guest House #' . $bookingId, $bodyAdmin, $adminType, $booking['email'] ?? null);
    }

    send_staying_guest_booking_email($pdo, $booking, 'paid', $payment, 'staying_guest_payment_successful', 'Booking confirmed for you');
}


function send_payment_failed_email(PDO $pdo, array $booking): void
{
    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId < 1) {
        return;
    }

    if (!booking_email_sent($pdo, $bookingId, ['payment_failed'])) {
        $body = booking_email_html('failed', $booking, [], false, email_button('Retry Payment', latest_booking_bill_url($pdo, $bookingId)));

        $sent = send_tracked_email($pdo, 'booking', $bookingId, (string) ($booking['email'] ?? ''), 'Payment failed - Jebal Guest House #' . $bookingId, $body, 'payment_failed');
        update_booking_email_status($pdo, $bookingId, $sent ? 'Sent' : 'Failed');
    }

    if (!booking_email_sent($pdo, $bookingId, ['admin_payment_failed'])) {
        $adminBody = booking_email_html('failed', $booking, [], true);

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


function queue_payment_success_emails(PDO $pdo, array $booking, array $payment): int
{
    $queued = 0;
    // Invoice download buttons are intentionally not included in booking emails.
    $invoiceLink = '';
    $amount = format_money_amount((float) ($payment['amount'] ?? $booking['amount'] ?? 0));
    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId < 1) {
        return 0;
    }

    $customerType = 'payment_successful';
    $adminType = 'admin_payment_received';

    if (!booking_email_sent($pdo, $bookingId, [$customerType])) {
        $bodyCustomer = booking_email_html('paid', $booking, $payment, false, $invoiceLink);

        if (enqueue_email(
            $pdo,
            'booking',
            $bookingId,
            (string) ($booking['email'] ?? ''),
            'Payment successful - Jebal Guest House #' . $bookingId,
            $bodyCustomer,
            $customerType,
            null,
            3,
            booking_from_email(),
            booking_from_name()
        )) {
            $queued++;
        }
    }

    $adminEmail = booking_admin_email();
    if ($adminEmail !== '' && !booking_email_sent($pdo, $bookingId, [$adminType])) {
        $bodyAdmin = booking_email_html('paid', $booking, $payment, true);

        if (enqueue_email(
            $pdo,
            'booking',
            $bookingId,
            $adminEmail,
            'Payment received - Jebal Guest House #' . $bookingId,
            $bodyAdmin,
            $adminType,
            $booking['email'] ?? null,
            3,
            booking_from_email(),
            booking_from_name()
        )) {
            $queued++;
        }
    }

    if (queue_staying_guest_booking_email($pdo, $booking, 'paid', $payment, 'staying_guest_payment_successful', 'Booking confirmed for you')) {
        $queued++;
    }

    if ($queued > 0) {
        update_booking_email_status($pdo, $bookingId, 'Payment Email Queued');
    }

    return $queued;
}

function queue_payment_failed_email(PDO $pdo, array $booking): int
{
    $queued = 0;
    $bookingId = (int) ($booking['id'] ?? 0);

    if ($bookingId < 1) {
        return 0;
    }

    if (!booking_email_sent($pdo, $bookingId, ['payment_failed'])) {
        $body = booking_email_html('failed', $booking, [], false, email_button('Retry Payment', latest_booking_bill_url($pdo, $bookingId)));

        if (enqueue_email(
            $pdo,
            'booking',
            $bookingId,
            (string) ($booking['email'] ?? ''),
            'Payment failed - Jebal Guest House #' . $bookingId,
            $body,
            'payment_failed',
            null,
            3,
            booking_from_email(),
            booking_from_name()
        )) {
            $queued++;
        }
    }

    $adminEmail = booking_admin_email();
    if ($adminEmail !== '' && !booking_email_sent($pdo, $bookingId, ['admin_payment_failed'])) {
        $adminBody = booking_email_html('failed', $booking, [], true);

        if (enqueue_email(
            $pdo,
            'booking',
            $bookingId,
            $adminEmail,
            'Payment failed - Jebal Guest House #' . $bookingId,
            $adminBody,
            'admin_payment_failed',
            $booking['email'] ?? null,
            3,
            booking_from_email(),
            booking_from_name()
        )) {
            $queued++;
        }
    }

    if ($queued > 0) {
        update_booking_email_status($pdo, $bookingId, 'Payment Failed Email Queued');
    }

    return $queued;
}


function send_booking_status_changed_email(PDO $pdo, array $booking, string $oldStatus, string $newStatus): void
{
    $label = status_label_for_email($newStatus);
    $tone = strtolower($label) === 'confirmed' ? 'green' : (strtolower($label) === 'cancelled' ? 'red' : 'blue');
    $bookingId = (int) ($booking['id'] ?? 0);

    $body = booking_email_html('updated', $booking, [], false, '', [
        'New Booking Status' => $label,
    ]);

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

    $body = booking_email_html('updated', $booking, $payment, false, '', [
        'New Payment Status' => $label,
        'Amount' => $amount,
    ]);

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

    $body = booking_email_html('updated', $booking, $payment, false, '', [
        'Booking Status' => $bookingLabel,
        'Payment Status' => $paymentLabel,
        'Amount' => $amount,
    ]);

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
        $adminBody = contact_admin_email_html($name, $email, $phone, $subject, $message, $ref);

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
        $customerBody = contact_customer_email_html($name, $email, $phone, $subject, $message, $ref);

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
            from_email VARCHAR(190) NULL,
            from_name VARCHAR(190) NULL,
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
    email_queue_add_column_if_missing($pdo, 'from_email', "from_email VARCHAR(190) NULL AFTER reply_to_email");
    email_queue_add_column_if_missing($pdo, 'from_name', "from_name VARCHAR(190) NULL AFTER from_email");
    email_queue_add_column_if_missing($pdo, 'subject', "subject VARCHAR(255) NOT NULL AFTER from_name");
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
    int $maxAttempts = 3,
    ?string $fromEmail = null,
    ?string $fromName = null
): bool {
    ensure_email_queue_table($pdo);

    $to = trim($to);
    $replyTo = $replyTo !== null ? trim($replyTo) : null;
    $fromEmail = $fromEmail !== null ? trim($fromEmail) : null;
    $fromName = $fromName !== null ? trim($fromName) : null;

    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        error_log('Email queue skipped invalid recipient: ' . $to);
        return false;
    }

    if ($replyTo !== null && $replyTo !== '' && !filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $replyTo = null;
    }

    if ($fromEmail !== null && $fromEmail !== '' && !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
        $fromEmail = null;
    }

    if ($fromName === '') {
        $fromName = null;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO email_queue
            (related_type, related_id, recipient_email, reply_to_email, from_email, from_name, subject, body_html, email_type, status, attempts, max_attempts, available_at, created_at, updated_at)
         VALUES
            (:related_type, :related_id, :recipient_email, :reply_to_email, :from_email, :from_name, :subject, :body_html, :email_type, 'pending', 0, :max_attempts, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            subject = VALUES(subject),
            body_html = VALUES(body_html),
            reply_to_email = VALUES(reply_to_email),
            from_email = VALUES(from_email),
            from_name = VALUES(from_name),
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
        ':from_email' => $fromEmail,
        ':from_name' => $fromName !== null ? mb_substr($fromName, 0, 190) : null,
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
    $adminEmail = contact_admin_email();

    if ($adminEmail !== '' && filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
        $adminBody = contact_admin_email_html($name, $email, $phone, $subject, $message, $ref);

        if (enqueue_email(
            $pdo,
            'enquiry',
            $enquiryId,
            $adminEmail,
            'New contact enquiry - Jebal Guest House ' . $ref,
            $adminBody,
            'admin_contact_enquiry',
            $email,
            3,
            contact_from_email(),
            contact_from_name()
        )) {
            $queued++;
        }
    } else {
        error_log('ADMIN_EMAIL is missing or invalid. Contact admin queue skipped for enquiry #' . $enquiryId);
    }

    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $customerBody = contact_customer_email_html($name, $email, $phone, $subject, $message, $ref);

        if (enqueue_email(
            $pdo,
            'enquiry',
            $enquiryId,
            $email,
            'We received your message - Jebal Guest House ' . $ref,
            $customerBody,
            'contact_auto_reply',
            null,
            3,
            contact_from_email(),
            contact_from_name()
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
        $fromEmail = isset($job['from_email']) && $job['from_email'] !== null ? (string) $job['from_email'] : null;
        $fromName = isset($job['from_name']) && $job['from_name'] !== null ? (string) $job['from_name'] : null;

        if ($fromEmail === null || trim($fromEmail) === '') {
            [$fromEmail, $fromName] = email_sender_for_type($emailType, $relatedType);
        }

        try {
            $bodyHtml = email_queue_body_from_job($job);
            $ok = send_html_email($to, $subject, $bodyHtml, $replyTo, $fromEmail, $fromName);

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
