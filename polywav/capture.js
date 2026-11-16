// Runs on Web Audio's rendering thread. Only PCM and meter data leave it.
class Capture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.demoCount = options.processorOptions.demoCount;
    this.count = -1;
    this.sample = 0;
    this.nextMeter = 0;
    this.port.onmessage = ({ data }) => {
      if (data.type === "start") {
        this.take = { id: data.id, indices: data.indices, armed: new Set(data.indices),
          limit: data.limit, frames: 0, used: 0 };
        this.newBlock();
      } else if (data.type === "stop") {
        this.finish();
      } else if (data.type === "marker" && this.take) {
        this.port.postMessage({ type: "marker", id: this.take.id, frames: this.take.frames, note: data.note });
      }
    };
  }

  newBlock() {
    this.take.buffer = new Uint8Array(4096 * this.take.indices.length * 3);
  }

  flush() {
    const { buffer, used, frames } = this.take;
    if (used) this.port.postMessage({ type: "pcm", id: this.take.id, buffer: buffer.buffer, used, frames }, [buffer.buffer]);
  }

  finish(reason) {
    if (!this.take) return;
    this.flush();
    this.port.postMessage({ type: "finished", id: this.take.id, frames: this.take.frames, reason });
    this.take = null;
  }

  process(inputs, outputs) {
    const input = inputs[0] || [];
    const count = this.demoCount || input.length;
    if (count !== this.count) {
      this.count = count;
      this.peaks = new Float32Array(count);
      this.port.postMessage({ type: "channels", count });
    }
    if (this.take && this.take.indices.some((index) => index >= count)) {
      this.finish("The browser lost one or more armed channels.");
    }
    const frames = outputs[0][0].length;
    for (let frame = 0; frame < frames; frame++) {
      const take = this.take;
      for (let ch = 0; ch < count; ch++) {
        const amplitude = this.demoCount
          ? 0.27 * Math.sin(2 * Math.PI * (220 + ch * 83) * this.sample / sampleRate)
          : input[ch][frame];
        this.peaks[ch] = Math.max(this.peaks[ch], Math.abs(amplitude));
        if (take?.armed.has(ch)) {
          const pcm = Math.max(-8388608, Math.min(8388607, Math.round(amplitude * 8388608)));
          take.buffer[take.used++] = pcm;
          take.buffer[take.used++] = pcm >> 8;
          take.buffer[take.used++] = pcm >> 16;
        }
      }
      this.sample++;
      if (take) {
        take.frames++;
        if (take.frames >= take.limit) this.finish("Recording reached its size limit. The take was saved.");
        else if (take.used === take.buffer.length) {
          this.flush();
          take.used = 0;
          this.newBlock();
        }
      }
    }
    if (this.sample >= this.nextMeter) {
      this.port.postMessage({ type: "meters", peaks: Array.from(this.peaks),
        id: this.take?.id, frames: this.take?.frames ?? 0 });
      this.peaks.fill(0);
      this.nextMeter = this.sample + sampleRate / 12;
    }
    // The graph stays active and outputs silence to prevent feedback.
    return true;
  }
}

registerProcessor("polywav-input", Capture);
