// Pure geometry and timing. Pose names refer to the player's own left/right.
export const POSES=[
 {id:'t',name:'Arms out',left:'out',right:'out'},
 {id:'up',name:'Both arms up',left:'up',right:'up'},
 {id:'left',name:'Your left arm up',left:'up',right:'down'},
 {id:'right',name:'Your right arm up',left:'down',right:'up'}
];
export const JOINTS=[11,12,13,14,15,16,23,24];
const unit=v=>{const n=Math.hypot(v.x,v.y);return n<1e-6?null:{x:v.x/n,y:v.y/n}};
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
export function referencePose(pose){
 const p=Array.from({length:33},()=>({x:.5,y:.5,visibility:0}));
 for(const [i,x,y] of [[0,.5,.26],[11,.65,.42],[12,.35,.42],[23,.61,.72],[24,.39,.72]])p[i]={x,y,visibility:1};
 for(const [shoulder,elbow,wrist,side,direction] of [[11,13,15,1,pose.left],[12,14,16,-1,pose.right]]){
  const s=p[shoulder];const dx=direction==='out'?side:0,dy=direction==='up'?-1:direction==='down'?1:0;
  p[elbow]={x:s.x+dx*.16,y:s.y+dy*.16,visibility:1};p[wrist]={x:s.x+dx*.31,y:s.y+dy*.31,visibility:1};
 }return p;
}
export function scorePose(points,pose,aspect=1){
 if(!points||JOINTS.some(i=>!points[i]||!Number.isFinite(points[i].x)||!Number.isFinite(points[i].y)||(points[i].visibility??0)<.55))return {tracked:false,score:0,reason:'Keep shoulders, elbows, wrists, and hips visible.'};
 const p=points.map(v=>({x:v.x*aspect,y:v.y}));
 const shoulder={x:(p[11].x+p[12].x)/2,y:(p[11].y+p[12].y)/2},hip={x:(p[23].x+p[24].x)/2,y:(p[23].y+p[24].y)/2};
 if(Math.hypot(...[shoulder.x-hip.x,shoulder.y-hip.y])<.05)return {tracked:false,score:0,reason:'Move into view so your torso is visible.'};
 const up=unit(minus(shoulder,hip)),side=unit(minus(p[11],p[12]));if(!up||!side)return {tracked:false,score:0,reason:'Face the camera.'};
 let error=0;
 for(const [s,e,w,sign,direction] of [[11,13,15,1,pose.left],[12,14,16,-1,pose.right]]){
  const target=direction==='up'?up:direction==='down'?{x:-up.x,y:-up.y}:{x:side.x*sign,y:side.y*sign};
  for(const [a,b] of [[s,e],[e,w]]){const v=unit(minus(p[b],p[a]));if(!v)return {tracked:false,score:0,reason:'Arm landmarks overlap; face the camera.'};error+=Math.acos(Math.max(-1,Math.min(1,v.x*target.x+v.y*target.y)));}
 }
 return {tracked:true,score:Math.round(Math.max(0,1-error/4/(Math.PI/2))*100),reason:'Tracking upper body'};
}
export function makeChart({bpm,onsets=[],duration=35,beatsPerPose=8,maxCues=120}){
 if(!Number.isFinite(bpm)||bpm<40||bpm>240)throw Error('Need a usable BPM estimate before starting.');
 const period=60/bpm,times=onsets.map(v=>typeof v==='number'?v:v.time).filter(Number.isFinite).sort((a,b)=>a-b);
 const first=times[0]??0,last=times.length?times.at(-1):duration;
 // Circular mean of onset phase, falling back to the first onset when ambiguous.
 const sx=times.reduce((sum,t)=>sum+Math.cos(t/period*2*Math.PI),0),sy=times.reduce((sum,t)=>sum+Math.sin(t/period*2*Math.PI),0);
 let phase=times.length&&Math.hypot(sx,sy)>.15*times.length?((Math.atan2(sy,sx)/(2*Math.PI)*period)%period+period)%period:first%period;
 const start=phase+Math.ceil((first+4*period-phase)/period)*period;
 const end=Math.min(duration,last),cues=[];
 for(let t=start;t<end-.4&&cues.length<maxCues;t+=period*beatsPerPose)cues.push({time:t,pose:POSES[cues.length%POSES.length]});
 if(!cues.length)throw Error('Capture a longer section: at least 10–15 seconds of steady music.');
 return {bpm,period,phase,cues};
}
export class RoundScorer {
 constructor(cues){this.cues=cues;this.index=0;this.samples=[];this.results=[];this.lastTime=null;this.discontinuity=false}
 update(time,match){
  if(this.lastTime!==null&&(time<this.lastTime-.25||time-this.lastTime>1.5)){this.discontinuity=true;return null}this.lastTime=time;
  const cue=this.cues[this.index];if(!cue)return null;
  if(Math.abs(time-cue.time)<=.35&&match?.tracked)this.samples.push(match.score);
  if(time>cue.time+.35){const tracked=this.samples.length>=2,score=tracked?Math.round(this.samples.reduce((a,b)=>a+b,0)/this.samples.length):null;
   const result={time:cue.time,pose:cue.pose.id,score,rating:!tracked?'Not tracked':score>=85?'Perfect':score>=65?'Good':'Keep practicing'};
   this.results.push(result);this.samples=[];this.index++;return result;
  }return null;
 }
}
