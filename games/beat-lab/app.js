import {parseVideoId,OnsetDetector} from './detector.mjs';
const $=id=>document.getElementById(id);
const detector=new OnsetDetector();
let player,ready=false,videoId='',analysisVideoId=null,apiPromise,ctx,stream,node,filter,oscillator,demoTimer;
let mode='idle',busy=false,lastFrame=0,lastAnchorCheck=0,anchor=null,pulseUntil=0,trace=[],logs=[],startedAt=null,lastSignal=0,lastWarning=0,replayIndex=0,lastReplayTime=-1;
let diagnostics={secureContext:isSecureContext,tabCapture:!!navigator.mediaDevices?.getDisplayMedia,audioWorklet:!!window.AudioWorkletNode,silentConstraint:!!navigator.mediaDevices?.getSupportedConstraints?.().suppressLocalAudioPlayback};
function log(message,detail){const entry={at:new Date().toISOString(),message,...(detail===undefined?{}:{detail})};logs.push(entry);logs=logs.slice(-200);$('log').textContent=logs.map(x=>`${x.at.slice(11,19)} ${x.message}${x.detail===undefined?'':' '+JSON.stringify(x.detail)}`).join('\n');$('log').scrollTop=$('log').scrollHeight}
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error)}
function showDiagnostics(){const dl=$('diagnostics');dl.replaceChildren();for(const [k,v] of Object.entries(diagnostics)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=typeof v==='object'?JSON.stringify(v):String(v);dl.append(dt,dd)}}
function updateButtons(){const active=!!ctx;$('capture').disabled=busy||active||!ready||!diagnostics.tabCapture||!isSecureContext;$('demo').disabled=busy||active||!isSecureContext;$('stop').disabled=busy||!active;$('url').disabled=active;$('load-form').querySelector('button').disabled=active;$('silent').disabled=active;$('reset').disabled=active;$('replay').disabled=busy||!ready||!detector.events.length||!analysisVideoId||analysisVideoId!==videoId||mode==='demo';$('export').disabled=busy}
function flash(){pulseUntil=performance.now()+120}
function ensureAPI(){
 if(window.YT?.Player)return Promise.resolve();if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('YouTube API timed out. Check network access or content blockers, then reload this page.')),20000);window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve()};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{clearTimeout(timeout);reject(Error('Could not load the YouTube player API.'))};document.head.append(script)});return apiPromise;
}
$('load-form').addEventListener('submit',async e=>{
 e.preventDefault();try{const id=parseVideoId($('url').value);busy=true;updateButtons();message('Loading YouTube player…');await ensureAPI();ready=false;videoId=id;detector.reset();trace=[];anchor=null;mode='idle';if(player)player.destroy();
 player=new YT.Player('player',{width:720,height:405,videoId:id,playerVars:{playsinline:1,origin:location.origin},events:{
 onReady(){ready=true;const rates=player.getAvailablePlaybackRates();$('rate').replaceChildren(...rates.map(rate=>new Option(`${rate}×`,rate)));$('rate').value='1';$('rate').disabled=false;$('play').disabled=false;log('Player ready',{videoId:id,rates});message('Press Play, then Start tab capture. Choose this tab and enable Share tab audio.');updateButtons()},
 onStateChange(e){log('Player state',e.data);if(e.data!==1){anchor=null}if(e.data===0&&mode==='capture'){message('Video ended. Stopping capture; timing is ready to export or replay.');stopCapture().catch(fail)}},
 onPlaybackRateChange(e){anchor=null;if(mode==='capture')detector.segment();$('rate').value=String(e.data);log('Actual playback rate',e.data)},
 onError(e){const errors={2:'Invalid video ID.',5:'YouTube HTML5 playback failed.',100:'Video unavailable or private.',101:'Embedding is disabled for this video.',150:'Embedding is disabled for this video.',153:'YouTube requires a valid site referrer. Use HTTPS or localhost; do not open this file directly.'};fail(Error(errors[e.data]||`YouTube error ${e.data}`));}
 }});
 }catch(err){fail(err)}finally{busy=false;updateButtons()}
});
$('play').onclick=()=>{if(ready){if(player.getPlayerState()===1)player.pauseVideo();else player.playVideo()}};
$('rate').onchange=()=>{if(ready){player.setPlaybackRate(Number($('rate').value));log('Requested playback rate',Number($('rate').value))}};
function fail(err){log('ERROR',{name:err.name,message:err.message});message(err.message,true)}
async function makeGraph(sourceStream,demo=false){
 ctx=new AudioContext({latencyHint:'interactive'});await ctx.resume();await ctx.audioWorklet.addModule('./meter-worklet.js');
 filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=Number($('band').value);
 node=new AudioWorkletNode(ctx,'energy-meter');const silent=ctx.createGain();silent.gain.value=0;filter.connect(node);node.connect(silent);silent.connect(ctx.destination);
 node.port.onmessage=({data})=>receive(data);
 if(demo){
  oscillator=ctx.createOscillator();oscillator.frequency.value=100;const envelope=ctx.createGain();envelope.gain.value=0;oscillator.connect(envelope).connect(filter);
  const start=ctx.currentTime+.5;
  for(let i=0;i<30;i++){const t=start+i*.5;envelope.gain.setValueAtTime(.8,t);envelope.gain.exponentialRampToValueAtTime(.00001,t+.07)}
  oscillator.start();demoTimer=setTimeout(()=>{message('Self-test finished. Expected BPM: 120. Export diagnostics if the estimate differs.');stopCapture().catch(fail)},16000);
 }else ctx.createMediaStreamSource(sourceStream).connect(filter);
 diagnostics={...diagnostics,sampleRate:ctx.sampleRate,audioContext:ctx.state,source:demo?'internal 120 BPM pulse train':'shared tab'};ctx.onstatechange=()=>{diagnostics.audioContext=ctx?.state||'closed';showDiagnostics()};
 startedAt=performance.now();lastSignal=startedAt;lastWarning=0;anchor=null;lastAnchorCheck=0;trace=[];showDiagnostics();
}
$('band').onchange=()=>{if(filter&&ctx){filter.frequency.setValueAtTime(Number($('band').value),ctx.currentTime);detector.segment();log('Detection band changed',$('band').value)}};
$('capture').onclick=async()=>{
 if(busy||ctx)return;
 busy=true;updateButtons();let selected;
 try{
  // Invoke the picker directly from the click handler to preserve user activation.
  selected=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser'},audio:{suppressLocalAudioPlayback:$('silent').checked,echoCancellation:false,noiseSuppression:false,autoGainControl:false},selfBrowserSurface:'include',systemAudio:'exclude'});
  if(!selected.getAudioTracks().length)throw Error('No audio track was shared. Try again: select a browser tab and enable Share tab audio.');
  stream=selected;if(analysisVideoId!==videoId)detector.reset();analysisVideoId=videoId;detector.segment();mode='capture';await makeGraph(stream);
  const a=stream.getAudioTracks()[0],v=stream.getVideoTracks()[0];
  diagnostics={...diagnostics,audioSettings:a.getSettings(),videoSettings:v?.getSettings(),silentRequested:$('silent').checked};
  const suppression=a.getSettings().suppressLocalAudioPlayback??v?.getSettings().suppressLocalAudioPlayback;
  diagnostics.silenceResult=suppression===true?'reported enabled':suppression===false?'reported disabled':'unverified (browser did not report it)';
  log('Capture started',diagnostics);showDiagnostics();for(const t of stream.getTracks())t.onended=()=>{log('Browser ended sharing');stopCapture().catch(fail)};
  message('Capture active. '+($('silent').checked?`Speaker suppression: ${diagnostics.silenceResult}. `:'')+'Play the video and watch the input meter. Stop capture before normal replay.');
 }catch(err){selected?.getTracks().forEach(t=>t.stop());await stopCapture();fail(err)}finally{busy=false;updateButtons()}
};
$('demo').onclick=async()=>{if(busy||ctx)return;busy=true;updateButtons();try{if(ready)player.pauseVideo();detector.reset();analysisVideoId=null;mode='demo';await makeGraph(null,true);log('Started silent 120 BPM self-test');message('Silent 120 BPM self-test running for 16 seconds. No camera or microphone is used.')}catch(err){await stopCapture();fail(err)}finally{busy=false;updateButtons()}};
async function stopCapture(){
 clearTimeout(demoTimer);demoTimer=null;const old=ctx;ctx=null;
 if(node){node.port.onmessage=null;node.disconnect();node=null}if(filter){filter.disconnect();filter=null}if(oscillator){try{oscillator.stop()}catch{}oscillator=null}
 if(stream){for(const t of stream.getTracks()){t.onended=null;t.stop()}stream=null}
 if(old&&old.state!=='closed')await old.close();
 if(mode!=='replay')mode='idle';anchor=null;diagnostics.audioContext='closed';showDiagnostics();updateButtons();log('Capture stopped',{onsets:detector.events.length});
}
$('stop').onclick=()=>stopCapture().then(()=>message('Capture stopped. No audio retained. You can replay or export the derived timing.')).catch(fail);
$('reset').onclick=()=>{detector.reset();trace=[];mode='idle';startedAt=null;log('Cleared analysis');message('Analysis cleared.');updateButtons()};
function receive(data){
 if(!ctx)return;const now=performance.now();$('level').value=Math.min(1,data.peak);if(data.energy>.001)lastSignal=now;
 trace.push({energy:data.energy,onset:false});if(trace.length>450)trace.shift();
 let sourceTime=data.time;
 if(mode==='capture'){
  if(!ready||player.getPlayerState()!==1)return;
  const rate=player.getPlaybackRate(),yt=player.getCurrentTime(),ct=ctx.currentTime;
  if(!anchor){detector.segment();anchor={video:yt,audio:ct,rate};lastAnchorCheck=ct;}
  else if(ct-lastAnchorCheck>.5){
   const predicted=anchor.video+(ct-anchor.audio)*anchor.rate;
   if(Math.abs(predicted-yt)>.45){detector.segment();log('Timing discontinuity; new segment',{expected:predicted,actual:yt});}
   anchor={video:yt,audio:ct,rate};lastAnchorCheck=ct;
  }
  // Account for queue latency and accelerated playback using the player timeline.
  sourceTime=Math.max(0,anchor.video+(data.time-anchor.audio)*anchor.rate);
 }
 const result=detector.feed(data.energy,data.time,sourceTime,Number($('sensitivity').value));
 if(result.onset){trace[trace.length-1].onset=true;flash();if(detector.events.length%16===1)log('Onset / tempo',{time:+sourceTime.toFixed(3),bpm:result.bpm,consistency:+result.confidence.toFixed(2)});updateButtons()}
 if(now-lastSignal>5000&&now-lastWarning>10000){lastWarning=now;log('No useful audio for 5 seconds. Check tab selection, Share tab audio, player volume, and playback state.');message('No useful audio detected. Check Share tab audio, selected tab, and that YouTube is playing and unmuted.',true)}
}
$('replay').onclick=async()=>{try{if(!ready)return;await stopCapture();const all=detector.events.filter(x=>Number.isFinite(x.time)).sort((a,b)=>a.time-b.time);detector.events=all;mode='replay';replayIndex=0;lastReplayTime=-1;player.setPlaybackRate(1);player.seekTo(0,true);player.playVideo();message('Replaying saved onset flashes. Adjust Flash offset if they lead or lag. No audio capture is active.');log('Replay started',{events:all.length})}catch(err){fail(err)}};
$('export').onclick=()=>{
 const payload={version:'0.1',createdAt:new Date().toISOString(),videoId:analysisVideoId,source:diagnostics.source||null,estimate:detector.tempo,sensitivity:Number($('sensitivity').value),bandHz:Number($('band').value),flashOffsetMs:Number($('offset').value),timingMethod:'Approximate AudioContext-to-YouTube clock mapping; uncalibrated capture latency. Onsets are not a validated beat grid.',onsets:detector.events,diagnostics,logs};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`beat-lab-${analysisVideoId||'self-test'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);log('Exported derived timing and diagnostics; no audio/video');
};
function frame(now){requestAnimationFrame(frame);if(now-lastFrame<45)return;lastFrame=now;
 $('pulse').classList.toggle('active',now<pulseUntil);$('bpm').textContent=detector.tempo.bpm||'—';$('confidence').textContent=detector.tempo.bpm?`${Math.round(detector.tempo.confidence*100)}%`:'—';$('count').textContent=detector.events.length;
 if(ready){const t=player.getCurrentTime(),duration=player.getDuration(),state=player.getPlayerState(),rate=player.getPlaybackRate();const names={'-1':'Unstarted',0:'Ended',1:'Playing',2:'Paused',3:'Buffering',5:'Cued'};$('player-state').textContent=`${names[state]||state} · ${rate}×`;$('scan-progress').value=duration?t/duration:0;$('position').textContent=`Video position: ${t.toFixed(1)} / ${duration.toFixed(1)} s`;
  if(mode==='replay'&&state===1){const adjusted=t-Number($('offset').value)/1000;if(adjusted<lastReplayTime-.2){replayIndex=0;while(replayIndex<detector.events.length&&detector.events[replayIndex].time<adjusted-.12)replayIndex++}
   let fired=false;while(replayIndex<detector.events.length&&detector.events[replayIndex].time<=adjusted){if(adjusted-detector.events[replayIndex].time<.15)fired=true;replayIndex++}if(fired)flash();lastReplayTime=adjusted;}
 }
 const c=$('scope'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.strokeStyle='#b4ff74';g.beginPath();trace.forEach((x,i)=>{const px=i*c.width/450,py=c.height-Math.min(1,x.energy*5)*(c.height-12)-6;i?g.lineTo(px,py):g.moveTo(px,py)});g.stroke();g.strokeStyle='#ff91c4';for(let i=0;i<trace.length;i++)if(trace[i].onset){const x=i*c.width/450;g.beginPath();g.moveTo(x,c.height);g.lineTo(x,0);g.stroke()}
}
window.addEventListener('error',e=>log('Window error',e.message));window.addEventListener('unhandledrejection',e=>fail(e.reason instanceof Error?e.reason:Error(String(e.reason))));window.addEventListener('pagehide',()=>{stream?.getTracks().forEach(t=>t.stop());ctx?.close()});
if(!isSecureContext||location.protocol==='file:')message('Serve this folder using HTTPS or http://localhost. Opening index.html directly will not work.',true);
showDiagnostics();updateButtons();log('Beat Lab initialized',diagnostics);requestAnimationFrame(frame);
