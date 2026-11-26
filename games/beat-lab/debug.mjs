// Keep historical logs independent of the changing live diagnostics object.
export function snapshotDetail(detail) {
 return detail===undefined?undefined:JSON.parse(JSON.stringify(detail));
}
export function captureHealth({contextState,elapsed,frames,lastFrameAge,signalAge,playerState}) {
 if(contextState==='closed')return {code:'closed',text:'Audio processing is closed. Start tab capture again.'};
 if(contextState!=='running')return {code:'suspended',text:'Audio processing is suspended. Click Resume audio processing.'};
 if(elapsed<3)return {code:'starting',text:'Waiting for audio processing to start…'};
 if(!frames||lastFrameAge>3)return {code:'no-frames',text:'No audio processing callbacks. Click Resume audio processing, or stop and share the tab again.'};
 if(playerState!==1)return {code:'not-playing',text:'Capture is connected, but the embedded YouTube player is not playing. Click Play / pause here or the video’s Play button. Share this Beat Lab tab, not a separate YouTube tab.'};
 if(signalAge>5)return {code:'silence',text:'Player is playing, but captured audio is silent. Check Share tab audio, the selected tab, and the player’s volume.'};
 return {code:'ok',text:'Audio processing and YouTube playback are active.'};
}
