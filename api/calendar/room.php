<?php
declare(strict_types=1);
require_once __DIR__ . '/ics-helper.php';
$roomId=(int)($_GET['room_id']??0);$token=(string)($_GET['token']??'');$mapping=null;
foreach(ics_connections() as $m){if((int)$m['room_id']===$roomId){$mapping=$m;break;}}
if(!$mapping||$token===''||!hash_equals((string)$mapping['export_token'],$token)){http_response_code(404);exit;}
$pdo=get_db_connection();$room=$pdo->prepare('SELECT room_name FROM rooms WHERE id=:id LIMIT 1');$room->execute([':id'=>$roomId]);if(!$room->fetch()){http_response_code(404);exit;}
$stmt=$pdo->prepare("SELECT id,check_in_date,check_out_date FROM bookings b JOIN rooms r ON r.room_name=b.room_name WHERE r.id=:room_id AND b.status IN ('Confirmed','Checked In','Checked Out') AND COALESCE(b.payment_status,'') NOT IN ('Failed','Cancelled','Refunded') ORDER BY b.check_in_date");$stmt->execute([':room_id'=>$roomId]);
header('Content-Type: text/calendar; charset=utf-8');header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');header('Pragma: no-cache');
$host=parse_url((string)(APP_BASE_URL?:'jebalguesthouse.local'),PHP_URL_HOST)?:'jebalguesthouse.local';
$out=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CompylX//Jebal Guest House Calendar//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
foreach($stmt->fetchAll() as $b){$out[]='BEGIN:VEVENT';$out[]='UID:booking-'.$b['id'].'-room-'.$roomId.'@'.$host;$out[]='DTSTAMP:'.gmdate('Ymd\THis\Z');$out[]='DTSTART;VALUE=DATE:'.str_replace('-','',$b['check_in_date']);$out[]='DTEND;VALUE=DATE:'.str_replace('-','',$b['check_out_date']);$out[]='SUMMARY:Unavailable';$out[]='END:VEVENT';}$out[]='END:VCALENDAR';echo implode("\r\n",$out)."\r\n";
