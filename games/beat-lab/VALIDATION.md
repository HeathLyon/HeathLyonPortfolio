# Validation

Completed:
- JavaScript syntax checks for app.js and meter-worklet.js.
- Deterministic tempo estimates at 80, 100, 120, and 150 BPM.
- Silence rejection; synthetic onset detection at 1x and 2x mapped source time.
- Jitter/missed-attack estimate and segment/reset behavior.
- YouTube link validation, including rejection of unrelated/forged hostnames.
- AudioWorklet energy summaries tested against synthesized 48 kHz sine input: approximately 100 summaries/second, correct RMS range, increasing timestamps.
- HTML asset references, unique IDs, and JavaScript UI bindings checked.

Not verified end-to-end:
- Browser sharing permission flow, actual tab audio, speaker suppression, live YouTube playback, playback-speed clock alignment, or arbitrary songs.
- Real-song beat accuracy or the suitability of the generated four-pose routine.

Use the README first-test sequence on desktop Chrome/Edge. The debug JSON is designed to help diagnose any failures.


v0.2 regression checks passed:
- Historical log snapshots remain running after live context changes to closed.
- Watchdog diagnoses unstarted/paused/buffering video, missing callbacks, suspended context, silence, and healthy capture.
- Mocked app integration verifies playback request, received/accepted counters, paused-input diagnosis, resumed processing, retained start log state, and release of both shared tracks.


v0.3 checks passed:
- Four ideal arm poses score correctly, with position/scale changes; opposite poses and occluded wrists are rejected.
- Chart spacing, score windows, untracked-round handling, and seek discontinuities tested.
- Mock camera lifecycle verifies camera enable, fresh-frame practice scoring, camera stop/track release, and controls.
- Existing audio and capture regressions pass after adding the pose integration bridge.
- MediaPipe 0.10.32 package metadata and ESM bundle, and Google's Pose Landmarker Lite model URL returned HTTP 200.
- Actual webcam inference, GPU/CPU fallback, real-song timing, and the complete UI have not been verified in a live browser here.
