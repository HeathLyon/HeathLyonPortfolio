import assert from 'node:assert/strict';
import {POSES,referencePose,scorePose,makeChart,RoundScorer} from './pose-core.mjs';
for(const target of POSES){
 const points=referencePose(target);assert.equal(scorePose(points,target,4/3).score,100,target.id);
 const resized=points.map(p=>({...p,x:p.x*.6+.15,y:p.y*.6+.1}));assert.equal(scorePose(resized,target,4/3).score,100,`${target.id} translation/scale`);
 const hidden=points.map(p=>({...p}));hidden[15].visibility=.1;assert.equal(scorePose(hidden,target).tracked,false);
}
assert(scorePose(referencePose(POSES[0]),POSES[1]).score<40,'T pose should not match arms up');
assert(scorePose(referencePose(POSES[2]),POSES[3]).score<20,'opposite arm should not match');
assert.equal(scorePose(null,POSES[0]).tracked,false);
const chart=makeChart({bpm:120,onsets:Array.from({length:61},(_,i)=>({time:i*.5+.1})),duration:31,beatsPerPose:8});
assert(chart.cues.length>=6);assert(Math.abs(chart.cues[1].time-chart.cues[0].time-4)<.001);
assert.throws(()=>makeChart({bpm:null}));assert.throws(()=>makeChart({bpm:120,onsets:[{time:1},{time:1.5}],duration:2}));
const rounds=new RoundScorer([{time:2,pose:POSES[0]}]);
for(let t=0;t<2.5;t+=.05)rounds.update(t,{tracked:true,score:90});
assert.equal(rounds.results.length,1);assert.equal(rounds.results[0].rating,'Perfect');assert.equal(rounds.results[0].score,90);
const missing=new RoundScorer([{time:2,pose:POSES[0]}]);for(let t=0;t<2.5;t+=.05)missing.update(t,{tracked:false,score:0});assert.equal(missing.results[0].score,null);assert.equal(missing.results[0].rating,'Not tracked');
const jump=new RoundScorer(chart.cues);jump.update(0,null);jump.update(10,null);assert(jump.discontinuity);
console.log('PASS: four poses, translation/scale invariance, missing landmarks, incorrect pose rejection, beat-grid spacing, timed scoring, untracked round skip, timeline jump detection.');
