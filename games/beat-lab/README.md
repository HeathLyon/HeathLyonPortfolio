# Heath FPV Beat Lab — prototype 0.3

A standalone test for a future webcam rhythm game. It includes a YouTube link player, user-approved tab-audio capture, an experimental silent-capture request, rate selection, input meter, onset flashes, estimated BPM, replay, and JSON diagnostics. Includes a simple upper-body pose and beat-sync experiment.

## Run on HeathFPV.com

Upload this entire folder's contents into `games/beat-lab/` in the website repository. Open `https://www.heathfpv.com/games/beat-lab/` after GitHub Pages updates. Keep the files together, with these exact names. This is a separate app; do not replace your docking simulator's index.html.

## Run locally on Windows

Install Python if necessary. Open a terminal in this folder and run:

    python -m http.server 8000 --bind 127.0.0.1

Open http://localhost:8000 in desktop Chrome or Edge. Do not double-click index.html. Hosting on GitHub Pages uses HTTPS and does not require Python.

## First test

1. Click Run silent 120 BPM self-test. Wait 16 seconds. Expect roughly 120 BPM once there are enough pulses; this checks the audio worklet and detector without sharing permission.
2. Paste a YouTube link and click Load video. Press Play.
3. Click Start tab capture. In the browser picker select THIS Beat Lab tab and enable Share tab audio, then approve sharing.
4. Watch the input meter and pink onset spikes. A zero meter usually means audio was not shared, the wrong tab was selected, or the player is paused/muted.
5. Try the video's available 2x speed. Actual rate is displayed next to the controls; a requested rate may not be supported.
6. For a new clean pass: stop capture, Clear analysis, seek the video to the beginning using the visible player, select the desired speed, start capture, and play. Keep the tab visible. Do not seek during analysis.
7. Stop capture & replay at 1x. Saved onset flashes should roughly follow percussion. Use Flash offset to compensate for capture latency.
8. Export timing + debug JSON if there is a problem. This includes video ID, timing events, settings, and bounded logs; no audio/video.

## Silence

Request silent speaker output uses the experimental `suppressLocalAudioPlayback` capture constraint. The browser may ignore it. Debug reports enabled/disabled/unverified based on returned track settings. Confirm on your own device before relying on it. Turning YouTube's own volume to zero may silence the captured input too. The app itself never routes captured audio back to speakers. Stopping capture releases all shared tracks.

## How detection works

A low-pass filter emphasizes bass attacks (or choose broadband). An AudioWorklet computes short-window energy summaries on the audio thread. A positive-energy-change detector uses an adaptive threshold and minimum onset spacing. Weighted inter-onset intervals vote for a rough tempo between 70–180 BPM. Timing consistency is an agreement score, not a calibrated probability.

Onset events are mapped approximately from the audio clock to YouTube's playback clock. Playback-speed changes, pauses, and significant seeks reset the current tempo segment. Events from prior segments remain until Clear analysis. Only data while the embedded video reports playing is mapped, so select this tab, not a different independently playing YouTube tab. Ads are not reliably identifiable through the iframe API; they can contaminate timing. Clear and repeat an affected pass.

Replay flashes stored measured attacks, NOT a full validated beat grid. Speech, soft music, syncopation, half/double tempo, rapid rate changes, and capture/player clock offsets can produce wrong estimates. Accelerated playback can reduce accuracy. Tests cover synthetic pulse/tempo behavior, not arbitrary-song reliability. Song sections and choreography generation are future work.

## Privacy & network

Audio PCM is processed transiently in the browser; it is not recorded, persisted, or uploaded. Captured video frames are never read or recorded, though the browser requires a video track for display capture. The app releases all tracks when stopped. Microphone access is never requested. Camera access is requested only after Enable camera is clicked; webcam frames are processed locally and are not recorded or uploaded. Only derived onset times/energies and debug details are retained in memory. Export is optional. YouTube receives normal embed/player requests when you load a link. YouTube loads its iframe API. Enabling pose tracking additionally loads the pinned MediaPipe Tasks Vision 0.10.32 runtime from jsDelivr and the Google-hosted Pose Landmarker Lite model. No analytics are included.

This is a technical capture experiment; it does not establish permission for every source. YouTube capture/analysis policy compatibility remains unresolved. Keep the player visible and leave its controls and advertisements intact.

## Files

- index.html: interface
- style.css: visual theme
- app.js: player, capture, clock mapping, replay, debug
- meter-worklet.js: audio-thread energy measurements
- detector.mjs: pure onset/tempo and link parsing logic
- test.mjs: deterministic signal, parser, and tempo checks (`node test.mjs`)


## v0.2 troubleshooting changes

- Start capture requests playback from the capture button gesture. If YouTube blocks autoplay, use the Play button inside the visible video.
- Resume audio processing provides a new browser gesture when AudioContext is suspended.
- A watchdog runs even if no audio callbacks arrive. It reports suspended processing, missing/stalled callbacks, a non-playing embedded video, and silent input separately.
- Debug fields receivedFrames and acceptedFrames distinguish incoming worklet frames from frames actually passed to the detector. If receivedFrames rises but acceptedFrames stays at zero, check playerState; it must be 1 (playing).
- Historical log details are immutable snapshots. Stopping capture no longer changes the earlier Capture started audioContext value.
- Run `node test-capture.mjs` for the mocked capture lifecycle regression checks. These do not substitute for testing real browser capture.
- After replacing files, hard-refresh with Ctrl+Shift+R. Test at 1x first. For silence, tick Request silent speaker output BEFORE starting capture; confirm the returned setting.


## v0.3 pose + beat test — start here

Upload ALL files into the same `games/beat-lab/` folder, replacing the earlier files. Do not upload the ZIP without extracting it. Hard refresh the page with Ctrl+Shift+R.

### Test the camera first

1. Scroll to 05 / Pose + beat test.
2. Click Enable camera & load tracking, approve CAMERA access, and wait for the model/runtime download (the model alone is about 5.8 MB).
3. Face the camera and step back until shoulders, elbows, wrists, and hips are visible. The preview and skeleton are mirrored. Pink marks your left arm.
4. Hold Arms out. Live match should approach 100%. Try Practice · 120 BPM. Optional click audio is synthesized locally.
5. Follow the target skeleton. A target is judged within ±0.35 seconds of its displayed target time. Rounds with fewer than two fresh, confident camera observations are skipped rather than scored as misses. Eight beats per pose gives more time to move; four is quicker.
6. Check Pose diagnostics if tracking drops, or Export pose test summary to share timing, scores, and confidence summaries. No raw video, images, or landmark sequences are exported.
7. Stop camera releases camera access. To change cameras, stop the camera, choose a labeled camera, and enable it again. The selector is populated after permission is granted.

### Test with your captured YouTube song

1. Analyze at least 15–30 seconds of continuous music using tab capture; 1x is easiest to validate first. You can keep the camera off during analysis to save processing time.
2. Stop audio capture. Do NOT Clear analysis or reload: timings are held only in memory.
3. Enable camera and click Play analyzed song + poses. The player returns to the beginning at 1x. If autoplay is blocked, click Play in the video.
4. The generator uses the estimated BPM and onset phase to create a CONSTANT-TEMPO grid, then assigns four repeating arm poses every 4 or 8 beats. It covers the analyzed portion only; it does not invent a reliable map for unheard sections.
5. Adjust the existing Flash offset if targets lead or lag. Positive values delay the game targets. Start a new round after seeking or a large timing adjustment.
6. When YouTube pauses/buffers, scoring pauses. A large clock jump stops the test to avoid awarding/missing multiple rounds at once.

### What is deliberately simple

Four poses: arms out, both arms up, your left arm up, your right arm up. Geometry uses arm directions relative to the torso, with size/position normalization. Detailed finger gestures, leg choreography, song-section detection, changing-tempo maps, multiplayer, and saved song charts are not included. The beat grid is approximate; irregular parody music can expose tempo/phase mistakes. Pose inference is capped near 12 FPS to leave resources for audio/player UI. GPU is tried first and CPU is the fallback.

### Additional checks

    node test-pose.mjs
    node test-pose-camera.mjs

These use synthetic landmarks and mocked camera APIs; actual webcam model inference and your real music still require browser testing.
