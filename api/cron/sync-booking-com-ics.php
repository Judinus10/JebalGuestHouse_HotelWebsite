<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../calendar/ics-helper.php';
if (!ics_enabled()) { fwrite(STDOUT, "ICS sync disabled.\n"); exit(0); }
$lock=fopen(sys_get_temp_dir().'/jebal-booking-ics.lock','c');
if(!$lock||!flock($lock,LOCK_EX|LOCK_NB)){fwrite(STDOUT,"ICS sync already running.\n");exit(0);} 
$pdo=get_db_connection();$results=[];
foreach(ics_connections() as $map){$results[]=sync_ics_room($pdo,$map);}
foreach($results as $r){fwrite(STDOUT,sprintf("room=%d status=%s events=%d\n",$r['room_id'],$r['success']?'success':'failed',(int)($r['events']??0)));}
flock($lock,LOCK_UN);fclose($lock);
exit(count(array_filter($results,fn($r)=>!$r['success']))>0?1:0);
