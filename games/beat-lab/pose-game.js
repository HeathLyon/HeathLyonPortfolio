import {beatSession} from './app.js?v=0.3';
import {POSES,referencePose,scorePose,makeChart,RoundScorer} from './pose-core.mjs';
const $=id=>document.getElementById(id);
const PACKAGE='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32';
const MODEL='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const edges=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
let tracker,cameraStream,cameraBusy=false,animation=null,lastVideoTime=-1,lastInference=0,lastDebug=0,landmarks=null,lastSeen=0,inferenceMs=0,poseFrames=0;
let gameVideoId=null;
let chart=null,rounds=null,gameMode=null,practiceEpoch=0,waitingForSong=false,lastSongTime=null,total=0,clickContext=null,completedResults=[];
function status(text,error=false){$('pose-status').textContent=text;$('pose-status').style.color=error?'#ff8b92':''}
function buttons(){const active=!!cameraStream;$('camera-start').disabled=cameraBusy||active;$('camera-stop').disabled=cameraBusy||!active;$('camera-select').disabled=cameraBusy||active;$('practice-start').disabled=!active||!!gameMode;$('song-start').disabled=!active||!!gameMode;$('game-stop').disabled=!gameMode;$('pose-spacing').disabled=!!gameMode;$('practice-click').disabled=!!gameMode}
function drawSkeleton(canvas,points,mirror=true){
 const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);if(!points)return;
 const xy=p=>[(mirror?1-p.x:p.x)*canvas.width,p.y*canvas.height];
 for(const [a,b] of edges){if((points[a]?.visibility??0)<.55||(points[b]?.visibility??0)<.55)continue;g.strokeStyle=[11,13,15].includes(b)?'#ff91c4':'#b4ff74';g.lineWidth=5;g.beginPath();g.moveTo(...xy(points[a]));g.lineTo(...xy(points[b]));g.stroke()}
 for(const p of points){if((p.visibility??0)<.55)continue;g.fillStyle='#eef9ff';g.beginPath();g.arc(...xy(p),4,0,Math.PI*2);g.fill()}
}
function currentCue(){return rounds?.cues[rounds.index]??null}
function showTarget(){const cue=currentCue(),target=cue?.pose||POSES[0];$('target-name').textContent=target.name;drawSkeleton($('target-pose'),referencePose(target));$('target-next').textContent=rounds?.cues[rounds.index+1]?'Next: '+rounds.cues[rounds.index+1].pose.name:'Next: '+(gameMode?'Finish':POSES[1].name)}
async function refreshCameras(){try{const old=$('camera-select').value;const devices=await navigator.mediaDevices.enumerateDevices();$('camera-select').replaceChildren(new Option('Default camera',''),...devices.filter(d=>d.kind==='videoinput').map((d,i)=>new Option(d.label||`Camera ${i+1}`,d.deviceId)));$('camera-select').value=old}catch(e){beatSession.log('Camera list unavailable',e.message)}}
$('camera-start').onclick=async()=>{
 if(cameraBusy||cameraStream)return;cameraBusy=true;buttons();let selected;
 try{
  if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('Camera requires HTTPS or localhost and browser camera support.');
  status('Requesting camera access…');const id=$('camera-select').value;
  selected=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:20,max:30},...(id?{deviceId:{exact:id}}:{facingMode:'user'})},audio:false});
  cameraStream=selected;$('webcam').srcObject=selected;await $('webcam').play();await refreshCameras();
  if(!tracker){
   status('Downloading pose tracking model… first launch may take a moment.');
   const {FilesetResolver,PoseLandmarker}=await import(PACKAGE+'/vision_bundle.mjs');
   const vision=await FilesetResolver.forVisionTasks(PACKAGE+'/wasm');
   try{tracker=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5,outputSegmentationMasks:false});beatSession.log('Pose tracker ready',{delegate:'GPU'})}
   catch(gpuError){beatSession.log('Pose GPU unavailable; trying CPU',gpuError.message);tracker=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:MODEL,delegate:'CPU'},runningMode:'VIDEO',numPoses:1,outputSegmentationMasks:false});beatSession.log('Pose tracker ready',{delegate:'CPU'})}
  }
  selected.getVideoTracks()[0].onended=()=>{status('Camera sharing ended.');stopCamera()};
  lastVideoTime=-1;poseFrames=0;landmarks=null;status('Camera ready. Face forward and keep shoulders, wrists, and hips in view.');beatSession.log('Camera started',{settings:selected.getVideoTracks()[0].getSettings()});animation=requestAnimationFrame(loop);
 }catch(e){selected?.getTracks().forEach(t=>t.stop());stopCamera();status('Camera / model error: '+e.message,true);beatSession.log('Pose initialization error',{name:e.name,message:e.message})}
 finally{cameraBusy=false;buttons()}
};
function stopCamera(){stopGame();if(animation)cancelAnimationFrame(animation);animation=null;if(cameraStream)for(const t of cameraStream.getTracks()){t.onended=null;t.stop()}cameraStream=null;$('webcam').srcObject=null;landmarks=null;drawSkeleton($('pose-overlay'),null);$('pose-match').textContent='—';buttons()}
$('camera-stop').onclick=()=>{stopCamera();status('Camera stopped. No video was recorded.')};
function stopGame(note='Pose test stopped.'){
 if(rounds)completedResults=rounds.results.slice();if(clickContext){clickContext.close().catch(()=>{});clickContext=null}
 gameMode=null;waitingForSong=false;lastSongTime=null;$('pose-result').textContent=note;buttons();
}
$('game-stop').onclick=()=>stopGame();
function prepareGame(selectedChart,mode){gameVideoId=mode==='song'?beatSession.snapshot().videoId:null;chart=selectedChart;rounds=new RoundScorer(chart.cues);completedResults=[];gameMode=mode;total=0;$('pose-total').textContent='0';$('pose-countdown').textContent='—';$('pose-result').textContent='Match the pose when the countdown reaches zero.';showTarget();buttons();beatSession.log('Pose test started',{mode,bpm:chart.bpm,rounds:chart.cues.length,beatsPerPose:Number($('pose-spacing').value)})}
$('practice-start').onclick=async()=>{
 try{
  const spacing=Number($('pose-spacing').value);prepareGame(makeChart({bpm:120,duration:2+8*spacing*.5,beatsPerPose:spacing}), 'practice');
  practiceEpoch=performance.now()+400;
  if($('practice-click').checked){clickContext=new AudioContext();await clickContext.resume();practiceEpoch=performance.now()+400;const start=clickContext.currentTime+.4;
   for(let i=0;i<Math.ceil(chart.cues.at(-1).time/.5)+3;i++){const osc=clickContext.createOscillator(),gain=clickContext.createGain();osc.frequency.value=i%4===0?1000:700;gain.gain.setValueAtTime(.0001,start+i*.5);gain.gain.exponentialRampToValueAtTime(.12,start+i*.5+.004);gain.gain.exponentialRampToValueAtTime(.0001,start+i*.5+.045);osc.connect(gain).connect(clickContext.destination);osc.start(start+i*.5);osc.stop(start+i*.5+.05)}
  }
 }catch(e){stopGame(e.message);status(e.message,true)}
};
$('song-start').onclick=async()=>{
 try{
  const s=beatSession.snapshot(true);if(!s.ready||s.analysisVideoId!==s.videoId||s.onsets.length<10)throw Error('Analyze at least 15 seconds of this video first, then stop capture.');
  if(s.isCapturing)throw Error('Stop audio capture before starting the pose game.');
  const next=makeChart({bpm:s.bpm,onsets:s.onsets,duration:s.duration,beatsPerPose:Number($('pose-spacing').value)});
  prepareGame(next,'song');waitingForSong=true;lastSongTime=null;await beatSession.beginReplay();
  $('pose-result').textContent='Waiting for normal-speed YouTube playback. Click Play inside the video if needed.';
 }catch(e){stopGame(e.message);status(e.message,true)}
};
function loop(now){
 if(!cameraStream)return;animation=requestAnimationFrame(loop);
 const video=$('webcam');let inferred=false;
 if(video.readyState>=2&&video.currentTime!==lastVideoTime&&now-lastInference>=80){
  lastVideoTime=video.currentTime;lastInference=now;
  try{const t=performance.now(),result=tracker.detectForVideo(video,now);inferenceMs=performance.now()-t;landmarks=result.landmarks?.[0]||null;inferred=true;poseFrames++;if(landmarks)lastSeen=now;
   const overlay=$('pose-overlay');if(overlay.width!==video.videoWidth||overlay.height!==video.videoHeight){overlay.width=video.videoWidth;overlay.height=video.videoHeight;$('webcam').parentElement.style.aspectRatio=`${video.videoWidth}/${video.videoHeight}`}
   drawSkeleton(overlay,landmarks);
  }catch(e){beatSession.log('Pose inference failed',e.message);stopCamera();tracker?.close();tracker=null;status('Pose tracking stopped: '+e.message,true);return}
 }
 const cue=currentCue(),target=cue?.pose||POSES[0],match=scorePose(now-lastSeen<250?landmarks:null,target,video.videoWidth/(video.videoHeight||1));
 $('pose-match').textContent=match.tracked?`${match.score}%`:'—';
 if(!gameMode)status(match.tracked?'Tracking ready. Try Arms out, then start Practice or your analyzed song.':match.reason);
 if(gameMode){
  const snapshot=gameMode==='song'?beatSession.snapshot():null;
  let time=(now-practiceEpoch)/1000,playing=true;
  if(snapshot){
   playing=snapshot.playerState===1&&snapshot.rate===1&&!snapshot.isCapturing;
   time=snapshot.time-Number($('offset').value)/1000;
   if(!playing){$('pose-result').textContent=snapshot.rate!==1?'Waiting for playback speed 1×.':snapshot.isCapturing?'Stop tab capture to continue.':'Paused / buffering — scoring paused.';}
   if(waitingForSong&&playing){if(snapshot.time>1.5){stopGame('Replay did not return to the start. Click Play analyzed song + poses to retry.');return}waitingForSong=false}
  }
  if(playing&&!waitingForSong&&time>=0){
   const current=currentCue();if(current){$('pose-countdown').textContent=Math.max(0,current.time-time).toFixed(1);
    const result=rounds.update(time,inferred?match:null);if(rounds.discontinuity){stopGame('Video timing jumped. Restart the pose test after seeking.');return}
    if(result){if(result.score!==null)total+=result.score;$('pose-total').textContent=String(total);$('pose-result').textContent=`${result.rating}${result.score===null?'':` · ${result.score}%`}`;showTarget()}
   }
   const beat=Math.floor((time-chart.phase)/chart.period);$('beat-dots').textContent=Array.from({length:4},(_,i)=>i===((beat%4)+4)%4?'●':'○').join(' ');
   if(rounds.index>=rounds.cues.length){const scored=rounds.results.filter(r=>r.score!==null),avg=scored.length?Math.round(total/scored.length):0;stopGame(`Finished · ${total} points · ${avg}% average · ${rounds.results.length-scored.length} untracked rounds`);beatSession.log('Pose test finished',{total,average:avg,rounds:completedResults})}
  }
 }
 if(now-lastDebug>500){lastDebug=now;$('pose-debug').textContent=JSON.stringify({cameraFrames:poseFrames,inferenceMs:+inferenceMs.toFixed(1),bodyDetected:!!landmarks,fresh:now-lastSeen<250,tracking:match.tracked,match:match.score,reason:match.reason,mode:gameMode||'preview',round:rounds?`${rounds.index+1}/${rounds.cues.length}`:null,bpm:chart?.bpm??null,points:total,visibility:landmarks?Object.fromEntries([11,12,13,14,15,16,23,24].map(i=>[i,+(landmarks[i]?.visibility??0).toFixed(2)])):null},null,2)}
}
$('pose-export').onclick=()=>{const s=beatSession.snapshot(),payload={version:'0.3',videoId:gameVideoId,chart:chart?{bpm:chart.bpm,phase:chart.phase,cues:chart.cues.map(c=>({time:c.time,pose:c.pose.id}))}:null,results:rounds?.results||completedResults,points:total,inferenceMs,frames:poseFrames,poseDebug:$('pose-debug').textContent};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='beat-lab-pose-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
window.addEventListener('pagehide',()=>{cameraStream?.getTracks().forEach(t=>t.stop());tracker?.close();clickContext?.close()});
showTarget();buttons();
