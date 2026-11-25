// A lightweight onset detector and interval-voting tempo estimate. No ML dependency.
export function parseVideoId(value) {
 const v=value.trim(); if (/^[\w-]{11}$/.test(v)) return v;
 let u; try { u=new URL(v); } catch { throw Error('Paste a valid YouTube link or 11-character video ID.'); }
 if (!['https:','http:'].includes(u.protocol)) throw Error('Use an HTTP/HTTPS YouTube link.');
 const host=u.hostname.toLowerCase(); let id;
 if (host==='youtu.be') id=u.pathname.split('/')[1];
 else if (['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)) {
  id=u.searchParams.get('v') || (/^\/(shorts|embed|live)\//.test(u.pathname)?u.pathname.split('/')[2]:null);
 }
 if (!id || !/^[\w-]{11}$/.test(id)) throw Error('This is not a supported YouTube video link.'); return id;
}
export function estimateTempo(times) {
 const t=times.slice(-48); if(t.length<6) return {bpm:null,confidence:0};
 const votes=new Map();
 for(let i=1;i<t.length;i++) for(let j=Math.max(0,i-6);j<i;j++) {
  const delta=t[i]-t[j]; if(delta<0.2||delta>4) continue;
  // Fold repeated-beat intervals into a playable tempo range.
  let bpm=60/delta; while(bpm<70) bpm*=2; while(bpm>180) bpm/=2;
  const bin=Math.round(bpm); votes.set(bin,(votes.get(bin)||0)+1/(i-j));
 }
 let best=0,score=0,total=0;
 for(const [bin] of votes){let s=0;for(let k=-2;k<=2;k++)s+=(votes.get(bin+k)||0)*(1-Math.abs(k)/3);if(s>score){score=s;best=bin}}
 for(const v of votes.values()) total+=v;
 return {bpm:best||null,confidence:total?Math.min(1,score/total):0};
}
export class OnsetDetector {
 constructor(){this.reset()}
 reset(){this.history=[];this.previous=0;this.last=-Infinity;this.events=[];this.tempoTimes=[];this.tempo={bpm:null,confidence:0}}
 segment(){this.history=[];this.previous=0;this.last=-Infinity;this.tempoTimes=[];this.tempo={bpm:null,confidence:0}}
 feed(energy,captureTime,sourceTime,sensitivity=1.4){
  const novelty=Math.max(0,energy-this.previous);this.previous=energy;
  const h=this.history,mean=h.length?h.reduce((a,b)=>a+b,0)/h.length:0;
  const sd=h.length?Math.sqrt(h.reduce((a,b)=>a+(b-mean)**2,0)/h.length):0;
  const threshold=mean+sensitivity*sd+0.001;
  const onset=h.length>=25&&energy>0.003&&novelty>threshold&&captureTime-this.last>0.115;
  h.push(novelty);if(h.length>100)h.shift();
  if(onset){this.last=captureTime;this.events.push({time:sourceTime,energy});this.tempoTimes.push(sourceTime);this.tempo=estimateTempo(this.tempoTimes);}
  return {onset,novelty,threshold,...this.tempo};
 }
}
