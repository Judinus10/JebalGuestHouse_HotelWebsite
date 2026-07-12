<?php
/** Administrator contact enquiry email template. */

declare(strict_types=1);

function contact_admin_email_html(string $name, string $email, string $phone, string $subject, string $message, string $ref): string
{
    $content = '<h1 style="margin:0 0 18px;color:#111111;font-size:28px;line-height:1.2;font-weight:800;">New contact enquiry received</h1>
    <p style="margin:0 0 18px;color:#111111;font-size:16px;line-height:1.6;">Hi Hotel Team,</p>
    <p style="margin:0;color:#111111;font-size:16px;line-height:1.6;">A new contact message has been submitted from the<br>Jebal Guest House website. Please review and reply<br>to the guest as soon as possible.</p>' .
    contact_reference_pill($ref) .
    contact_email_detail_card([
        ['icon' => 'ref', 'label' => 'Reference ID', 'value' => $ref],
        ['icon' => 'user', 'label' => 'Guest Name', 'value' => $name],
        ['icon' => 'mail', 'label' => 'Email', 'value' => $email],
        ['icon' => 'phone', 'label' => 'Phone', 'value' => $phone],
        ['icon' => 'mail', 'label' => 'Subject', 'value' => $subject],
        ['icon' => 'message', 'label' => 'Message', 'value' => $message],
    ]) .
    contact_support_block();

    return contact_email_shell('New contact enquiry received', $content, 'A new contact enquiry was submitted from the website.');
}



