import assert from 'node:assert/strict';
import {OnsetDetector,estimateTempo,parseVideoId} from './detector.mjs';
for(const link of ['dQw4w9WgXcQ','https://youtu.be/dQw4w9WgXcQ?t=4','https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com/shorts/dQw4w9WgXcQ'])assert.equal(parseVideoId(link),'dQw4w9WgXcQ');
for(const link of ['https://evil.example/watch?v=dQw4w9WgXcQ','https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ','nope','javascript:alert(1)'])assert.throws(()=>parseVideoId(link));
for(const bpm of [80,100,120,150]){const result=estimateTempo(Array.from({length:30},(_,i)=>i*60/bpm));assert(Math.abs(result.bpm-bpm)<=2,`${bpm} estimated ${result.bpm}`)}
const silent=new OnsetDetector();for(let i=0;i<2000;i++)silent.feed(0,i*.01,i*.01);assert.equal(silent.events.length,0);assert.equal(silent.tempo.bpm,null);
for(const rate of [1,2]){
 const d=new OnsetDetector();
 for(let i=0;i<1600;i++){const t=i*.01,source=t*rate,phase=source%.5;const energy=phase<.03?.3:.00001;d.feed(energy,t,source)}
 assert(d.events.length>20,`onsets at ${rate}x`);assert(Math.abs(d.tempo.bpm-120)<=2,`120 BPM normalized at ${rate}x: ${d.tempo.bpm}`);
 const count=d.events.length;d.segment();assert.equal(d.events.length,count);assert.equal(d.tempo.bpm,null);d.reset();assert.equal(d.events.length,0);
}
// Jitter and a few missed attacks should still yield a usable estimate.
const irregular=Array.from({length:40},(_,i)=>i*.5+Math.sin(i)*.008).filter((_,i)=>i%9!==0);assert(Math.abs(estimateTempo(irregular).bpm-120)<=3);
console.log('PASS: URL validation, 80/100/120/150 BPM, silence rejection, 1x/2x source timing, jitter/missed attacks, segment/reset behavior.');
