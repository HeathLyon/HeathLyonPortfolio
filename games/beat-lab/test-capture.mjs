// Integration test with browser APIs replaced by deterministic fakes; no live capture.
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseVideoId,OnsetDetector} from './detector.mjs';
import {snapshotDetail,captureHealth} from './debug.mjs';
const nodes=new Map();
const element=id=>nodes.get(id)||nodes.set(id,{value:id==='band'?'220':id==='sensitivity'?'1.4':'',checked:false,disabled:false,textContent:'',classList:{toggle(){}},replaceChildren(){},append(){},addEventListener(){},querySelector(){return element('load-button')}}).get(id);
let now=0,state=-1,playRequests=0,stops=0;
class Context {
 constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.destination={};this.audioWorklet={addModule:async()=>{}}}
 async resume(){this.state='running'} async close(){this.state='closed'}
 createBiquadFilter(){return {frequency:{value:0},connect(){},disconnect(){}}}
 createGain(){return {gain:{value:0},connect(){}}}
 createMediaStreamSource(){return {connect(){}}}
}
const audio={getSettings:()=>({sampleRate:48000,suppressLocalAudioPlayback:false}),stop(){stops++}};
const video={getSettings:()=>({displaySurface:'browser'}),stop(){stops++}};
const stream={getAudioTracks:()=>[audio],getVideoTracks:()=>[video],getTracks:()=>[audio,video]};
const sandbox={parseVideoId,OnsetDetector,snapshotDetail,captureHealth,document:{getElementById:element,createElement:()=>({})},isSecureContext:true,navigator:{mediaDevices:{getDisplayMedia:async()=>stream,getSupportedConstraints:()=>({})}},window:{AudioWorkletNode:true,addEventListener(){}},location:{protocol:'https:',origin:'https://example.com'},performance:{now:()=>now},requestAnimationFrame(){},setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){},AudioContext:Context,AudioWorkletNode:class{constructor(){this.port={}}connect(){}disconnect(){}},console};
vm.createContext(sandbox);
const source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
vm.runInContext(source+`\nglobalThis.test={setPlayer(p){player=p;ready=true;videoId='dQw4w9WgXcQ'},receive,checkHealth,stopCapture,get diagnostics(){return diagnostics},get logs(){return logs},get context(){return ctx}}`,sandbox);
const api=sandbox.test;api.setPlayer({getPlayerState:()=>state,playVideo(){playRequests++},getPlaybackRate:()=>1,getCurrentTime:()=>now/1000});
await element('capture').onclick();assert.equal(playRequests,1);assert.equal(api.diagnostics.audioContext,'running');
for(let i=0;i<50;i++){now+=10;api.context.currentTime=now/1000;api.receive({time:now/1000,energy:.1,peak:.2})}
now=5000;api.checkHealth();assert.equal(api.diagnostics.health,'no-frames');
now=5100;api.context.currentTime=now/1000;api.receive({time:5.1,energy:.1,peak:.2});api.checkHealth();
assert.equal(api.diagnostics.health,'not-playing');assert.equal(api.diagnostics.acceptedFrames,0);assert.equal(api.diagnostics.receivedFrames,51);
state=1;now+=10;api.context.currentTime=now/1000;api.receive({time:now/1000,energy:.2,peak:.3});api.checkHealth();assert.equal(api.diagnostics.health,'ok');assert.equal(api.diagnostics.acceptedFrames,1);
await api.stopCapture();assert.equal(stops,2);assert.equal(api.diagnostics.audioContext,'closed');
const start=api.logs.find(x=>x.message==='Capture started');assert.equal(start.detail.audioContext,'running');
console.log('PASS: capture starts playback, paused input is diagnosed, stalled callbacks are diagnosed, playing input is processed, logs retain start state, all tracks stop.');
