// Broadcast WAV headers and SMPTE label conversion. No audio is resampled here.
export const rates = {
  "23.976": [24000, 1001, 24], "24": [24, 1, 24], "25": [25, 1, 25],
  "29.97 NDF": [30000, 1001, 30], "29.97 DF": [30000, 1001, 30, true], "30": [30, 1, 30],
};
const utf8 = new TextEncoder();
const pad = (v) => String(v).padStart(2, "0");

export function toSamples(label, rate, sampleRate) {
  const [num, den, nominal, drop] = rate;
  const match = /^(\d\d):(\d\d):(\d\d)([:;])(\d\d)$/.exec(label);
  if (!match || match[4] !== (drop ? ";" : ":")) throw Error("Enter timecode as HH:MM:SS" + (drop ? ";FF." : ":FF."));
  const [hours, minutes, seconds, frames] = [match[1], match[2], match[3], match[5]].map(Number);
  if (hours > 23 || minutes > 59 || seconds > 59 || frames >= nominal ||
      (drop && minutes % 10 && seconds === 0 && frames < 2)) throw Error("Enter a valid start frame for the selected rate.");
  const mins = hours * 60 + minutes;
  const dropped = drop ? 2 * (mins - Math.floor(mins / 10)) : 0;
  return Math.ceil(((mins * 60 + seconds) * nominal + frames - dropped) * sampleRate * den / num);
}

export function duration(seconds) {
  const whole = Math.floor(seconds);
  return [Math.floor(whole / 3600), Math.floor(whole / 60) % 60, whole % 60].map(pad).join(":");
}

export function timecode(samples, rate, sampleRate) {
  const [num, den, nominal, drop] = rate;
  let frame = Math.floor(samples * num / (sampleRate * den));
  if (drop) frame += 18 * Math.floor(frame / 17982) + 2 * Math.max(0, Math.floor((frame % 17982 - 2) / 1798));
  return duration(Math.floor(frame / nominal) % 86400) + (drop ? ";" : ":") + pad(frame % nominal);
}

export function localSamples(date, hz) {
  return Math.floor((date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000) * hz);
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let pos = 0;
  for (const part of parts) { out.set(part, pos); pos += part.length; }
  return out;
}

function chunk(id, data) {
  const out = new Uint8Array(8 + data.length + data.length % 2);
  out.set(utf8.encode(id));
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

function xml(value) {
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
}

export function waveHeader(take, dataBytes = 0) {
  const { hz, channels, date, uid, start, rate, meta } = take;
  const count = channels.length, align = count * 3;
  const fmt = new Uint8Array(count > 2 ? 40 : 16);
  const view = new DataView(fmt.buffer);
  [count > 2 ? 0xfffe : 1, count].forEach((v, i) => view.setUint16(i * 2, v, true));
  view.setUint32(4, hz, true); view.setUint32(8, hz * align, true);
  view.setUint16(12, align, true); view.setUint16(14, 24, true);
  if (count > 2) {
    view.setUint16(16, 22, true); view.setUint16(18, 24, true);
    fmt.set([1,0,0,0,0,0,16,0,128,0,0,170,0,56,155,113], 24);
  }
  const bext = new Uint8Array(602);
  const ascii = (offset, size, text) => bext.set(utf8.encode(text.replace(/[^ -~]/g, "?")).slice(0,size), offset);
  ascii(0, 256, [meta.project, meta.roll, meta.scene, meta.take, meta.notes].filter(Boolean).join(" / "));
  ascii(256, 32, "PolyWAV Lite"); ascii(288, 32, uid);
  ascii(320, 10, [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(pad).join("-"));
  ascii(330, 8, [date.getHours(), date.getMinutes(), date.getSeconds()].map(pad).join(":"));
  const broadcast = new DataView(bext.buffer);
  broadcast.setBigUint64(338, BigInt(start), true); broadcast.setUint16(346, 1, true);
  const rateString = rate[0] + "/" + rate[1];
  const tags = (object) => Object.entries(object).map(([k,v]) => "<" + k + ">" + xml(v) + "</" + k + ">").join("");
  const speed = tags({ MASTER_SPEED: rateString, CURRENT_SPEED: rateString, TIMECODE_RATE: rateString,
    TIMECODE_FLAG: rate[3] ? "DF" : "NDF", FILE_SAMPLE_RATE: hz, AUDIO_BIT_DEPTH: 24,
    TIMESTAMP_SAMPLE_RATE: hz, TIMESTAMP_SAMPLES_SINCE_MIDNIGHT_HI: Math.floor(start / 4294967296),
    TIMESTAMP_SAMPLES_SINCE_MIDNIGHT_LO: start % 4294967296 });
  const tracks = channels.map(({ index, name }, i) => "<TRACK>" +
    tags({ CHANNEL_INDEX:index + 1, INTERLEAVE_INDEX:i + 1, NAME:name }) + "</TRACK>").join("");
  const ixml = '<' + '?xml version="1.0" encoding="UTF-8"?>' + "<BWFXML>" +
    tags({ IXML_VERSION:"2.10", PROJECT:meta.project, TAPE:meta.roll, SCENE:meta.scene, TAKE:meta.take,
      NOTE:meta.notes, FILE_UID:uid }) + "<SPEED>" + speed + "</SPEED><TRACK_LIST><TRACK_COUNT>" +
    count + "</TRACK_COUNT>" + tracks + "</TRACK_LIST></BWFXML>";
  const header = concat([utf8.encode("RIFF"), new Uint8Array(4), utf8.encode("WAVE"),
    chunk("fmt ",fmt), chunk("bext",bext), chunk("iXML",utf8.encode(ixml)), utf8.encode("data"), new Uint8Array(4)]);
  const sizes = new DataView(header.buffer);
  sizes.setUint32(4, header.length - 8 + dataBytes + dataBytes % 2, true);
  sizes.setUint32(header.length - 4, dataBytes, true);
  return header;
}

export function csvReport(take) {
  const cell = (value) => {
    let text = String(value);
    if (/^\s*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [["File","Project","Roll","Scene","Take","Timecode","Offset seconds","Note","Tracks"]];
  for (const marker of [{ frames:0, note:take.meta.notes }, ...take.markers]) {
    rows.push([take.name, take.meta.project, take.meta.roll, take.meta.scene, take.meta.take,
      timecode(take.start + marker.frames,take.rate,take.hz), (marker.frames/take.hz).toFixed(3), marker.note,
      take.channels.map(({name})=>name).join(" | ")]);
  }
  return rows.map((row)=>row.map(cell).join(",")).join("\r\n");
}
