import { rates, toSamples, duration, timecode, localSamples, waveHeader, csvReport } from "./wave.js";

const byId = (id) => document.getElementById(id);
const settingIds = ["project","roll","scene","take","tc-mode","fps","start","notes","requested","device","disk"];
const profiles = Array.from({ length: 32 }, (_, index) => ({ index, name: "Input " + (index + 1), armed: true }));
const memoryLimit = 256 * 1024 * 1024;
let context, node, stream, count = 0, demo = false, busy = false, inputChanged = false;
let active, completed, downloadURL;
let rows = [];
const buttonIds = ["connect","demo","disk","disconnect"];

function message(text, error = false) {
  byId("status").textContent = text;
  byId("status").dataset.error = String(error);
}

function controls() {
  const locked = busy || Boolean(active);
  for (const id of [...settingIds, ...buttonIds]) byId(id).disabled = locked;
  byId("start").disabled = locked || byId("tc-mode").value !== "manual";
  for (const row of rows) { row.input.disabled = locked; row.arm.disabled = locked; }
  byId("record").disabled = locked || inputChanged || !node || !count || !profiles.slice(0,count).some((track) => track.armed);
  byId("stop").disabled = !active || active.stopping;
  byId("add-marker").disabled = !active || active.stopping;
  byId("report").disabled = !completed;
  byId("disconnect").hidden = !node;
  byId("state").textContent = active?.stopping ? "SAVING" : active ? "RECORDING" : busy ? "WAIT" : "READY";
  document.body.classList.toggle("rolling", Boolean(active));
}

// Channel count comes from the worklet's actual incoming buffers. The
// menu's requested count is a hint to the browser and cannot create ISOs.
function showChannels(next) {
  count = Math.min(32, next);
  const requested = Number(byId("requested").value);
  byId("input-info").textContent = count
    ? (demo ? "Demo" : "Live") + " · " + count + " ch · " + context.sampleRate / 1000 + " kHz" +
      (!demo && count < requested ? " · requested " + requested : "")
    : "No input connected";
  rows = profiles.slice(0,count).map((profile) => {
    const row = byId("channel-row").content.firstElementChild.cloneNode(true);
    const input = row.querySelector(".name"), arm = row.querySelector(".armed input");
    const channel = "Channel " + (profile.index + 1);
    row.querySelector(".channel-id").textContent = String(profile.index + 1).padStart(2,"0");
    input.value = profile.name; arm.checked = profile.armed;
    input.setAttribute("aria-label", channel + " name"); arm.setAttribute("aria-label", "Arm " + channel);
    input.addEventListener("input", () => { profile.name = input.value; });
    arm.addEventListener("change", () => { profile.armed = arm.checked; controls(); });
    return { row, input, arm, meter: row.querySelector("meter"), db: row.querySelector(".db") };
  });
  byId("channels").replaceChildren(...rows.map(({row}) => row));
  controls();
}

async function deviceList() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const select = byId("device"), selected = select.value;
  const options = [new Option("System default",""), ...devices.filter((item) => item.kind === "audioinput" &&
    item.deviceId && item.deviceId !== "default").map((item, i) => new Option(item.label || "Input " + (i + 1), item.deviceId))];
  select.replaceChildren(...options);
  if (options.some((option) => option.value === selected)) select.value = selected;
}

async function disconnect() {
  node?.disconnect();
  node = null;
  for (const track of stream?.getTracks() || []) track.stop();
  stream = null;
  if (context && context.state !== "closed") await context.close();
  context = null;
  showChannels(0);
}

async function connect(useDemo) {
  if (busy || active || !byId("requested").reportValidity()) return;
  const requested = byId("requested").valueAsNumber;
  busy = true;
  controls();
  try {
    await disconnect();
    demo = useDemo;
    if (!useDemo && !navigator.mediaDevices?.getUserMedia) throw Error("Microphone access needs HTTPS or localhost.");
    context = new AudioContext({ sampleRate: 48000 });
    await context.resume();
    if (!useDemo) {
      const id = byId("device").value;
      const audio = { channelCount:{ideal:requested}, echoCancellation:false, noiseSuppression:false, autoGainControl:false };
      if (id) audio.deviceId = { exact:id };
      stream = await navigator.mediaDevices.getUserMedia({ audio });
    }
    await context.audioWorklet.addModule("./capture.js");
    const inputNode = new AudioWorkletNode(context,"polywav-input",{
      numberOfInputs:useDemo ? 0 : 1, numberOfOutputs:1, outputChannelCount:[1],
      channelCountMode:"max", channelInterpretation:"discrete",
      processorOptions:{ demoCount:useDemo ? requested : 0 },
    });
    node = inputNode;
    node.port.onmessage = ({data}) => { if (node === inputNode) onAudio(data); };
    node.onprocessorerror = () => {
      if (node !== inputNode) return;
      if (active) void finish(active, "Audio engine stopped. Saved the received audio.");
      void disconnect();
    };
    if (!useDemo) {
      context.createMediaStreamSource(stream).connect(node);
      stream.getAudioTracks()[0].addEventListener("ended", () => {
        if (node !== inputNode) return;
        if (active) stop("Input disconnected. Check the saved take.");
        else void disconnect();
      });
    }
    node.connect(context.destination);
    inputChanged = false;
    if (!useDemo) void deviceList().catch(() => {});
    message(useDemo ? "Demo input is generating test tones." : "Input connected. Check channel meters before recording.");
  } catch (error) {
    await disconnect();
    message(error.message || "Could not open the audio input.", true);
  } finally {
    busy = false;
    controls();
  }
}

function readTimecode(hz, date) {
  const rate = rates[byId("fps").value];
  return byId("tc-mode").value === "clock" ? localSamples(date,hz) : toSamples(byId("start").value.trim(),rate,hz);
}

function updateClock(take, frames) {
  byId("counter").textContent = timecode(take.start + frames,take.rate,take.hz);
  byId("elapsed").textContent = duration(frames / take.hz);
}

function idleClock() {
  if (active || completed) return;
  try {
    const hz = context?.sampleRate || 48000;
    updateClock({ start:readTimecode(hz,new Date()), rate:rates[byId("fps").value], hz },0);
  } catch { byId("counter").textContent = "––:––:––:––"; }
}

// Record uses either an approved file handle or a bounded in-memory take.
// The worklet never copies from the microphone to a speaker.
async function start() {
  if (byId("record").disabled) return;
  const source = node;
  const channels = profiles.slice(0,count).filter(({armed}) => armed)
    .map(({index,name}) => ({index,name:name.trim() || "Input " + (index+1)}));
  const meta = Object.fromEntries(["project","roll","scene","take","notes"].map((id) => [id,byId(id).value.trim()]));
  const hz = context.sampleRate, rate = rates[byId("fps").value], clock = byId("tc-mode").value === "clock";
  let writer;
  busy = true;
  controls();
  try {
    let date = new Date(), samples = readTimecode(hz,date);
    const uid = crypto.randomUUID().replaceAll("-","");
    const label = [demo ? "DEMO" : "",meta.roll,meta.scene,meta.take].filter(Boolean).join("_").replace(/[^\p{L}\p{N}_-]/gu,"-");
    const name = (label || "PolyWAV") + "_" + uid.slice(0,6) + ".wav";
    const direct = byId("disk").checked;
    if (direct) {
      const handle = await window.showSaveFilePicker({ suggestedName:name, types:[{ description:"Broadcast WAV", accept:{"audio/wav":[".wav"]} }] });
      writer = await handle.createWritable();
    }
    if (node !== source || !count || channels.some(({index}) => index >= count)) throw Error("Input changed. Connect it again.");
    await context.resume();
    if (clock) { date = new Date(); samples = localSamples(date,hz); }
    const take = { channels, meta, hz, rate, date, uid, start:samples, name, writer, chunks:[], bytes:0,
      markers:[], pending:Promise.resolve(), pendingBytes:0 };
    const header = waveHeader(take);
    if (writer) await writer.write(header);
    if (downloadURL) URL.revokeObjectURL(downloadURL);
    downloadURL = null;
    completed = null;
    byId("result").hidden = true;
    byId("markers").replaceChildren();
    active = take;
    const limitBytes = direct ? 0xffffffff - header.length - 2 : memoryLimit;
    const align = channels.length * 3;
    node.port.postMessage({ type:"start", id:uid, indices:channels.map(({index})=>index), limit:Math.floor(limitBytes/align) });
    updateClock(take,0);
    message(demo ? "Recording demo tones." : "Recording locally. Keep this tab open.");
  } catch (error) {
    if (writer) await writer.abort().catch(() => {});
    message(error.name === "AbortError" ? "Save canceled." : error.message, error.name !== "AbortError");
  } finally {
    busy = false;
    controls();
  }
}

function stop(reason = "") {
  const take = active;
  if (!take || take.stopping) return;
  take.stopping = true;
  take.reason = reason;
  node?.port.postMessage({ type:"stop" });
  take.timeout = setTimeout(() => { void finish(take, "Audio engine did not respond. Saved the received audio."); },2500);
  controls();
}

function receivePCM(take, data) {
  const bytes = new Uint8Array(data.buffer,0,data.used);
  take.bytes += bytes.length;
  if (!take.writer) { take.chunks.push(bytes); return; }
  take.pendingBytes += bytes.length;
  take.pending = take.pending.then(async () => {
    if (!take.writeError) await take.writer.write(bytes);
  }).catch((error) => {
    take.writeError = error;
    stop("Disk write failed.");
  }).finally(() => { take.pendingBytes -= bytes.length; });
  if (take.pendingBytes > 32 * 1024 * 1024) stop("Disk is slow. Recording stopped to protect the take.");
}

async function finish(take, reason) {
  if (take !== active || take.finishing) return;
  take.finishing = true;
  take.stopping = true;
  clearTimeout(take.timeout);
  controls();
  try {
    await take.pending;
    if (take.writeError) throw take.writeError;
    if (!take.bytes) throw Error("No audio was captured.");
    const header = waveHeader(take,take.bytes), padding = new Uint8Array(take.bytes % 2);
    const link = byId("download");
    if (take.writer) {
      if (padding.length) await take.writer.write(padding);
      await take.writer.write({ type:"write", position:0, data:header });
      await take.writer.close();
      link.hidden = true;
    } else {
      downloadURL = URL.createObjectURL(new Blob([header,...take.chunks,padding],{type:"audio/wav"}));
      link.href = downloadURL; link.download = take.name; link.hidden = false;
    }
    take.chunks.length = 0;
    completed = take;
    const frames = take.bytes / (3 * take.channels.length);
    take.markers = take.markers.filter((marker) => marker.frames <= frames);
    updateClock(take,frames);
    byId("finished").textContent = (take.writer ? "WAV saved" : take.name) + " · " + take.channels.length + " ch · " + (frames/take.hz).toFixed(1) + " s";
    byId("result").hidden = false;
    message(reason || take.reason || (take.writer ? "Take saved." : "Take ready to download."));
    if (/^\d{1,12}$/.test(take.meta.take)) byId("take").value = String(Number(take.meta.take)+1).padStart(take.meta.take.length,"0");
  } catch (error) {
    if (take.writer) await take.writer.abort().catch(() => {});
    message("Could not save the take: " + error.message,true);
  } finally {
    active = null;
    controls();
  }
}

function onAudio(data) {
  const take = active;
  if (data.type === "channels") showChannels(data.count);
  if (data.type === "meters") {
    for (const [index,row] of rows.entries()) {
      const db = Math.min(0,20 * Math.log10(data.peaks[index] || 0));
      row.meter.value = Math.max(-60,db);
      row.db.textContent = isFinite(db) ? String(Math.round(db)) : "−∞";
    }
    if (take && take.uid === data.id && !take.stopping) updateClock(take,data.frames);
  }
  if (!take || take.uid !== data.id || take.finishing) return;
  if (data.type === "pcm") receivePCM(take,data);
  if (data.type === "finished") void finish(take,data.reason);
  if (data.type === "marker") {
    take.markers.push({ frames:data.frames, note:data.note });
    const item = document.createElement("li");
    item.textContent = timecode(take.start + data.frames,take.rate,take.hz) + "  " + data.note;
    byId("markers").append(item);
  }
}

byId("connect").onclick = () => connect(false);
byId("demo").onclick = () => connect(true);
byId("disconnect").onclick = async () => {
  busy = true;
  controls();
  try {
    await disconnect();
    message("Input disconnected.");
  } catch (error) {
    message(error.message,true);
  } finally {
    busy = false;
    controls();
  }
};
byId("record").onclick = start;
byId("stop").onclick = () => stop();
byId("disk-label").hidden = typeof window.showSaveFilePicker !== "function";
for (const id of ["requested","device"]) byId(id).addEventListener("input",() => {
  if (node) {
    inputChanged = true;
    message("Reconnect the input to apply the new settings.");
    controls();
  }
});
byId("marker-form").addEventListener("submit",(event) => {
  event.preventDefault();
  if (!active || active.stopping) return;
  const field = byId("marker");
  node.port.postMessage({ type:"marker", note:field.value.trim() || "Marker" });
  field.value = "";
});
byId("report").onclick = () => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff",csvReport(completed)],{type:"text/csv"}));
  link.download = completed.name.replace(/\.wav$/,".csv");
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href),30000);
};
for (const id of ["tc-mode","fps","start"]) byId(id).addEventListener("input",() => {
  if (id === "fps") byId("start").value = byId("start").value.replace(/[:;](\d\d)$/,(match,frames) => (rates[byId("fps").value][3] ? ";" : ":") + frames);
  controls();
  idleClock();
});
for (const field of document.querySelectorAll("[data-panel]")) {
  const key = "polywav-lite.view." + field.dataset.panel;
  const panel = byId(field.dataset.panel);
  try { field.checked = localStorage.getItem(key) !== "off"; } catch { /* Use default. */ }
  panel.hidden = !field.checked;
  field.onchange = () => {
    panel.hidden = !field.checked;
    try { localStorage.setItem(key,field.checked ? "on" : "off"); } catch { /* The view still updates. */ }
  };
}
window.addEventListener("beforeunload",(event) => {
  if (active) { event.preventDefault(); event.returnValue = ""; }
});
void deviceList().catch(() => {});
setInterval(idleClock,100);
controls();
