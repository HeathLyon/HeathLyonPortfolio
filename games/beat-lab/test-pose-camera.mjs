// Camera lifecycle and practice scoring using mocks; does not access a real webcam.
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
import {POSES,referencePose,scorePose,makeChart,RoundScorer} from './pose-core.mjs';
const nodes=new Map();let now=0,stops=0;
const g={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};
const el=id=>nodes.get(id)||nodes.set(id,{textContent:'',value:id==='pose-spacing'?'8':'',checked:false,style:{},disabled:false,replaceChildren(){},getContext:()=>g,width:640,height:480,parentElement:{style:{}},videoWidth:640,videoHeight:480,currentTime:0,readyState:2,play:async()=>{},getTracks:()=>[],addEventListener(){}}).get(id);
const videoTrack={stop(){stops++},getSettings:()=>({width:640,height:480})};
const stream={getTracks:()=>[videoTrack],getVideoTracks:()=>[videoTrack]};
const sandbox={POSES,referencePose,scorePose,makeChart,RoundScorer,beatSession:{log(){},snapshot:()=>({ready:false}),beginReplay:async()=>{}},document:{getElementById:el},isSecureContext:true,navigator:{mediaDevices:{getUserMedia:async()=>stream,enumerateDevices:async()=>[]}},window:{addEventListener(){}},performance:{now:()=>now},requestAnimationFrame:()=>1,cancelAnimationFrame(){},Option:class{},console};
vm.createContext(sandbox);const src=fs.readFileSync(new URL('./pose-game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
vm.runInContext(src+`\nglobalThis.test={setTracker(t){tracker=t},loop,get cue(){return currentCue()},get results(){return rounds?.results},get mode(){return gameMode}};`,sandbox);
const api=sandbox.test;api.setTracker({detectForVideo(){return {landmarks:[referencePose(api.cue?.pose||POSES[0])]}}});
await el('camera-start').onclick();assert.equal(el('webcam').srcObject,stream);assert.equal(el('practice-start').disabled,false);
await el('practice-start').onclick();assert.equal(api.mode,'practice');
for(let i=0;i<65;i++){now=i*80;el('webcam').currentTime=now/1000;api.loop(now)}
assert.equal(api.results.length,1);assert.equal(api.results[0].score,100);
el('camera-stop').onclick();assert.equal(stops,1);assert.equal(el('webcam').srcObject,null);assert.equal(api.mode,null);assert.equal(el('practice-start').disabled,true);
console.log('PASS: camera start, practice target scoring from fresh frames, camera stop, track release, stopped-game controls.');
