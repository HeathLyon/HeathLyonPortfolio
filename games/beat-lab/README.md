# Heath FPV Beat Lab — prototype 0.1

A standalone test for a future webcam rhythm game. It includes a YouTube link player, user-approved tab-audio capture, an experimental silent-capture request, rate selection, input meter, onset flashes, estimated BPM, replay, and JSON diagnostics. No pose tracking yet.

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

Audio PCM is processed transiently in the browser; it is not recorded, persisted, or uploaded. Captured video frames are never read or recorded, though the browser requires a video track for display capture. The app releases all tracks when stopped. It does not request microphone or camera access. Only derived onset times/energies and debug details are retained in memory. Export is optional. YouTube receives normal embed/player requests when you load a link. The only external script is YouTube's iframe API; there are no analytics or model downloads.

This is a technical capture experiment; it does not establish permission for every source. YouTube capture/analysis policy compatibility remains unresolved. Keep the player visible and leave its controls and advertisements intact.

## Files

- index.html: interface
- style.css: visual theme
- app.js: player, capture, clock mapping, replay, debug
- meter-worklet.js: audio-thread energy measurements
- detector.mjs: pure onset/tempo and link parsing logic
- test.mjs: deterministic signal, parser, and tempo checks (`node test.mjs`)
