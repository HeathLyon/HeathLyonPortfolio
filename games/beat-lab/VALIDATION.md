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
- Real-song beat accuracy or choreography (choreography is not implemented).

Use the README first-test sequence on desktop Chrome/Edge. The debug JSON is designed to help diagnose any failures.
