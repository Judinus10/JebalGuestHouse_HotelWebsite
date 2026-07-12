<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';
function ics_enabled(): bool { return filter_var(jebal_env_value('ICS_SYNC_ENABLED', false), FILTER_VALIDATE_BOOLEAN); }
function ics_timezone(): DateTimeZone { try { return new DateTimeZone((string) jebal_env_value('ICS_DEFAULT_TIMEZONE', APP_TIMEZONE)); } catch (Throwable) { return new DateTimeZone('Asia/Colombo'); } }
function ics_connections(): array { $raw=jebal_env_value('ICS_ROOM_MAPPINGS_JSON','[]'); $rows=is_array($raw)?$raw:json_decode((string)$raw,true); return is_array($rows)?array_values(array_filter($rows,static fn($r)=>is_array($r)&&!empty($r['enabled'])&&(int)($r['room_id']??0)>0&&!empty($r['import_url'])&&!empty($r['export_token']))):[]; }
function ensure_ics_schema(PDO $pdo): void { static $done=false;if($done)return;$pdo->exec("CREATE TABLE IF NOT EXISTS external_calendar_events (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,room_id INT UNSIGNED NOT NULL,provider VARCHAR(40) NOT NULL DEFAULT 'booking.com',external_uid VARCHAR(255) NOT NULL,start_date DATE NOT NULL,end_date DATE NOT NULL,summary VARCHAR(255) NULL,status VARCHAR(40) NULL,external_last_modified DATETIME NULL,is_active TINYINT(1) NOT NULL DEFAULT 1,last_seen_at DATETIME NOT NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE KEY uniq_provider_room_uid (provider,room_id,external_uid),KEY idx_external_room_dates (room_id,start_date,end_date,is_active),CONSTRAINT fk_external_calendar_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");$pdo->exec("CREATE TABLE IF NOT EXISTS external_calendar_sync_status (room_id INT UNSIGNED NOT NULL PRIMARY KEY,provider VARCHAR(40) NOT NULL DEFAULT 'booking.com',last_sync_started_at DATETIME NULL,last_sync_completed_at DATETIME NULL,last_sync_status VARCHAR(30) NULL,last_sync_error TEXT NULL,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,CONSTRAINT fk_external_sync_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");$done=true; }
function ics_room_conflict(PDO $pdo,int $roomId,string $checkIn,string $checkOut): bool { ensure_ics_schema($pdo);$s=$pdo->prepare("SELECT id FROM external_calendar_events WHERE room_id=:room_id AND is_active=1 AND :ci < end_date AND :co > start_date LIMIT 1");$s->execute([':room_id'=>$roomId,':ci'=>$checkIn,':co'=>$checkOut]);return(bool)$s->fetch(); }
function unfold_ics(string $body): array { $body=preg_replace("/\r\n[ \t]/",'', $body);return preg_split('/\r\n|\n|\r/',(string)$body)?:[]; }
function parse_ics_date(string $value): ?DateTimeImmutable { $value=trim($value);if($value==='')return null;$tz=ics_timezone();try{if(preg_match('/^\d{8}$/',$value))return DateTimeImmutable::createFromFormat('!Ymd',$value,$tz)?:null;if(str_ends_with($value,'Z'))return(new DateTimeImmutable($value,new DateTimeZone('UTC')))->setTimezone($tz);return new DateTimeImmutable($value,$tz);}catch(Throwable){return null;} }
function parse_ics_events(string $body): array { $events=[];$current=null;foreach(unfold_ics($body)as$line){if($line==='BEGIN:VEVENT'){$current=[];continue;}if($line==='END:VEVENT'){if(is_array($current)&&!empty($current['UID'])&&!empty($current['DTSTART'])&&!empty($current['DTEND']))$events[]=$current;$current=null;continue;}if(!is_array($current)||!str_contains($line,':'))continue;[$left,$value]=explode(':',$line,2);$parts=explode(';',$left);$key=strtoupper(array_shift($parts));$current[$key]=$value;}return$events; }
function validate_ics_url(string $url): bool
{
    $parts = parse_url($url);
    if (!$parts || strtolower((string) ($parts['scheme'] ?? '')) !== 'https' || empty($parts['host'])) {
        return false;
    }

    $host = strtolower((string) $parts['host']);
    return $host === 'admin.booking.com' || str_ends_with($host, '.booking.com');
}

function fetch_local_test_ics(string $url): string
{
    if (!defined('APP_ENV') || APP_ENV !== 'local') {
        throw new RuntimeException('Local ICS testing is disabled outside the local environment.');
    }

    $parts = parse_url($url);
    $requestedFile = basename((string) ($parts['host'] ?? $parts['path'] ?? ''));
    if ($requestedFile === '' || !preg_match('/^[a-zA-Z0-9._-]+\.ics$/', $requestedFile)) {
        throw new RuntimeException('Invalid local ICS test filename.');
    }

    $toolDirectory = realpath(__DIR__ . '/../tool');
    if ($toolDirectory === false) {
        throw new RuntimeException('Local ICS tool directory does not exist.');
    }

    $filePath = realpath($toolDirectory . DIRECTORY_SEPARATOR . $requestedFile);
    if ($filePath === false || !str_starts_with($filePath, $toolDirectory . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
        throw new RuntimeException('Local ICS test file was not found.');
    }

    $maxBytes = (int) jebal_env_value('ICS_MAX_RESPONSE_BYTES', 1048576);
    $size = filesize($filePath);
    if ($size === false || $size > $maxBytes) {
        throw new RuntimeException('Local ICS test file exceeds the allowed size.');
    }

    $body = file_get_contents($filePath);
    if ($body === false) {
        throw new RuntimeException('Local ICS test file could not be read.');
    }

    return $body;
}

function fetch_ics(string $url): string
{
    if (str_starts_with(strtolower($url), 'local://')) {
        return fetch_local_test_ics($url);
    }

    if (!validate_ics_url($url)) {
        throw new RuntimeException('Untrusted calendar URL.');
    }

    $ch = curl_init($url);
    $max = (int) jebal_env_value('ICS_MAX_RESPONSE_BYTES', 1048576);
    $body = '';

    curl_setopt_array($ch, [
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => (int) jebal_env_value('ICS_REQUEST_TIMEOUT_SECONDS', 15),
        CURLOPT_USERAGENT => 'JebalGuestHouse-ICS/1.0',
        CURLOPT_WRITEFUNCTION => static function ($ch, $chunk) use (&$body, $max) {
            $body .= $chunk;
            if (strlen($body) > $max) {
                return 0;
            }
            return strlen($chunk);
        },
    ]);

    $ok = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($ok === false || $code < 200 || $code >= 300) {
        throw new RuntimeException('Calendar download failed' . ($err !== '' ? ': ' . $err : ''));
    }

    return $body;
}
function sync_ics_room(PDO $pdo,array $map): array { ensure_ics_schema($pdo);$roomId=(int)$map['room_id'];$now=(new DateTimeImmutable())->format('Y-m-d H:i:s');$pdo->prepare("INSERT INTO external_calendar_sync_status(room_id,last_sync_started_at,last_sync_status) VALUES(:r,:n,'running') ON DUPLICATE KEY UPDATE last_sync_started_at=VALUES(last_sync_started_at),last_sync_status='running',last_sync_error=NULL")->execute([':r'=>$roomId,':n'=>$now]);try{$events=parse_ics_events(fetch_ics((string)$map['import_url']));$seen=[];$pdo->beginTransaction();$up=$pdo->prepare("INSERT INTO external_calendar_events(room_id,external_uid,start_date,end_date,summary,status,external_last_modified,is_active,last_seen_at) VALUES(:r,:u,:s,:e,:m,:st,:lm,1,:seen) ON DUPLICATE KEY UPDATE start_date=VALUES(start_date),end_date=VALUES(end_date),summary=VALUES(summary),status=VALUES(status),external_last_modified=VALUES(external_last_modified),is_active=1,last_seen_at=VALUES(last_seen_at)");foreach($events as$ev){$start=parse_ics_date($ev['DTSTART']);$end=parse_ics_date($ev['DTEND']);if(!$start||!$end||$end<=$start)continue;$uid=mb_substr(trim($ev['UID']),0,255);$status=strtoupper(trim($ev['STATUS']??''));$up->execute([':r'=>$roomId,':u'=>$uid,':s'=>$start->format('Y-m-d'),':e'=>$end->format('Y-m-d'),':m'=>mb_substr(trim($ev['SUMMARY']??'Booking.com blocked'),0,255),':st'=>$status?:null,':lm'=>isset($ev['LAST-MODIFIED'])?(parse_ics_date($ev['LAST-MODIFIED'])?->format('Y-m-d H:i:s')):null,':seen'=>$now]);if(in_array($status,['CANCELLED','CANCELED'],true))$pdo->prepare("UPDATE external_calendar_events SET is_active=0 WHERE room_id=:r AND external_uid=:u")->execute([':r'=>$roomId,':u'=>$uid]);$seen[]=$uid;}$pdo->prepare("UPDATE external_calendar_events SET is_active=0 WHERE room_id=:r AND provider='booking.com' AND last_seen_at<:seen")->execute([':r'=>$roomId,':seen'=>$now]);$pdo->commit();$pdo->prepare("UPDATE external_calendar_sync_status SET last_sync_completed_at=:n,last_sync_status='success',last_sync_error=NULL WHERE room_id=:r")->execute([':n'=>$now,':r'=>$roomId]);return['room_id'=>$roomId,'events'=>count($seen),'success'=>true];}catch(Throwable$e){if($pdo->inTransaction())$pdo->rollBack();$pdo->prepare("UPDATE external_calendar_sync_status SET last_sync_completed_at=:n,last_sync_status='failed',last_sync_error=:e WHERE room_id=:r")->execute([':n'=>$now,':e'=>mb_substr($e->getMessage(),0,1000),':r'=>$roomId]);return['room_id'=>$roomId,'success'=>false,'error'=>$e->getMessage()];} }
function ics_escape(string $v): string { return str_replace(["\\",";",",","\r","\n"],["\\\\","\\;","\\,",'',"\\n"],$v); }
