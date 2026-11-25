// Only short-lived energy summaries leave this audio thread; PCM is never recorded.
class EnergyMeter extends AudioWorkletProcessor {
 constructor(){super();this.sum=0;this.n=0;this.peak=0;this.samples=0}
 process(inputs){
  const channels=inputs[0];if(!channels?.length)return true;
  for(let i=0;i<channels[0].length;i++){
   let sample=0;for(const channel of channels)sample+=channel[i]/channels.length;
   this.sum+=sample*sample;this.peak=Math.max(this.peak,Math.abs(sample));this.n++;this.samples++;
   if(this.n>=sampleRate*0.01){this.port.postMessage({time:currentTime+i/sampleRate,energy:Math.sqrt(this.sum/this.n),peak:this.peak});this.sum=0;this.n=0;this.peak=0}
  }
  // Output remains zero; capture is never monitored back through speakers.
  return true;
 }
}
registerProcessor('energy-meter',EnergyMeter);
