"use strict";

const sections = [["home","Boot"],["reel","Flight reel"],["projects","Projects"],["skills","Capabilities"],["contact","Contact"]];
const completions = ["help","about","status","ls","reel","projects","scans","skills","work","contact","next","prev","weather","weather precise","flightlog","cert","date","history","matrix on","matrix off","trail on","trail off","scanlines on","scanlines off","theme green","theme pink","theme amber","clear","reboot"];
const scroller = document.querySelector("#scroller");
const output = document.querySelector("#terminalOutput");
const form = document.querySelector("#terminalForm");
const input = document.querySelector("#terminalInput");
const runButton = document.querySelector("#terminalRun");
const statusLabel = document.querySelector("#terminalStatus");
const quickButtons = [...document.querySelectorAll("[data-command]")];
const matrixCanvas = document.querySelector("#matrixCanvas");
const trailCanvas = document.querySelector("#trailCanvas");
const scanlines = document.querySelector("#scanlines");
let active = "home", busy = true, matrixOn = true, trailOn = true;
let commandHistory = [], historyPosition = 0, matrixFrame = 0, trailFrame = 0;

document.querySelector("#year").textContent = new Date().getFullYear();

function add(text, tone = "") {
  const line = document.createElement("p");
  line.textContent = text;
  if (tone) line.className = tone;
  output.append(line);
  output.scrollTop = output.scrollHeight;
}

function setBusy(value) {
  busy = value;
  input.disabled = value;
  runButton.disabled = value;
  quickButtons.forEach(button => button.disabled = value);
  statusLabel.textContent = value ? "◌ BOOTING" : "● ONLINE";
  input.placeholder = value ? "initializing..." : "type “help”";
}

function boot() {
  output.replaceChildren();
  setBusy(true);
  const sequence = [
    ["initialize --portfolio --single-page","cmd"],
    ["[SUCCESS] flight archive mounted","ok"],
    ["[SUCCESS] project modules indexed","ok"],
    ["[SUCCESS] snap navigation synchronized","ok"],
    ["[READY] shell active — type “help”","pink"]
  ];
  sequence.forEach(([text,tone], index) => setTimeout(() => {
    add(text,tone);
    if (index === sequence.length - 1) {
      setBusy(false);
      input.focus();
    }
  }, 250 + index * 280));
}

function go(target) {
  const routes = {home:"home",boot:"home",reel:"reel",drone:"reel",projects:"projects",scans:"projects",archaeology:"projects",skills:"skills",work:"skills",contact:"contact"};
  const route = routes[target];
  if (!route) return add(`Unknown destination: ${target}`,"err");
  const section = document.getElementById(route);
  add(`[OPEN] #${route}`,"pink");
  history.replaceState(null,"",`#${route}`);
  scroller.scrollTo({top:section.offsetTop,behavior:"smooth"});
}

function step(direction) {
  const index = Math.max(0, sections.findIndex(([id]) => id === active));
  go(sections[Math.max(0,Math.min(sections.length - 1,index + direction))][0]);
}

async function weather(precise) {
  setBusy(true);
  add(precise ? "[INFO] requesting browser location..." : "[INFO] checking Provo flight conditions...","dim");
  try {
    let lat = 40.2338, lon = -111.6585, place = "PROVO, UT";
    if (precise) {
      const position = await new Promise((resolve,reject) => {
        if (!navigator.geolocation) return reject(new Error("location unavailable"));
        navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:8000});
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      place = "DEVICE LOCATION";
    }
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`);
    if (!response.ok) throw new Error(`weather link ${response.status}`);
    const {current} = await response.json();
    add(`[SUCCESS] WEATHER LINK: ${place}`,"ok");
    add(`${Math.round(current.temperature_2m)}°F | FEELS ${Math.round(current.apparent_temperature)}°F | WIND ${Math.round(current.wind_speed_10m)} MPH`,"pink");
  } catch (error) {
    add(`[ERROR] ${error.message || "weather unavailable"}`,"err");
  }
  setBusy(false);
}

async function run(raw) {
  const command = raw.trim();
  if (!command || busy) return;
  add(`root@heath:~$ ${command}`,"cmd");
  const [name,...args] = command.toLowerCase().split(/\s+/);
  if (name === "help" || name === "?") {
    ["AVAILABLE COMMANDS","about / status       operator and system data","ls / open <module>   inspect page modules","next / prev          move one snap section","reel / projects      open featured work","skills / contact     capability or contact","flightlog / cert     mission and credential data","weather [precise]    flight conditions","theme green|pink|amber","matrix / trail / scanlines on|off","date / history / clear / reboot"].forEach((line,index) => add(line,index ? "" : "ok"));
  } else if (name === "about" || name === "whoami") {
    add("HEATH LYON // FAA PART 107 REMOTE PILOT","ok");
    add("FPV cinematography + custom flight systems + computer vision + embedded electronics + interactive 3D.");
  } else if (name === "status") {
    add("PORTFOLIO........ ONLINE","ok"); add("FLIGHT SYSTEMS... READY","ok");
    add(`ACTIVE MODULE..... ${active.toUpperCase()}`,"pink"); add(`LOCAL CLOCK....... ${new Date().toLocaleString()}`);
  } else if (name === "ls" || name === "dir") {
    ["reel/","projects/","skills/","work-history/","contact/"].forEach(item => add(item,"pink"));
  } else if (["home","reel","drone","projects","scans","skills","work","contact"].includes(name)) {
    go(name);
  } else if (["open","cd","goto"].includes(name)) {
    args[0] ? go(args[0]) : add("Usage: open <reel|projects|skills|contact>","err");
  } else if (name === "next") step(1);
  else if (name === "prev") step(-1);
  else if (name === "weather") await weather(args[0] === "precise");
  else if (name === "flightlog") {
    add("2026 // HOMESTEAD-MIAMI AUDI F1 PRODUCTION","ok");
    add("2026—NOW // INDEPENDENT DRONE PILOT — THINK GLOBAL MEDIA");
    add("PLATFORMS // CUSTOM FPV / MAVIC / CINELIFTER","pink");
  } else if (name === "cert") add("FAA PART 107 REMOTE PILOT CERTIFICATE // ACTIVE","ok");
  else if (name === "date" || name === "time") add(new Date().toLocaleString(),"ok");
  else if (name === "history") commandHistory.forEach((item,index) => add(`${String(index + 1).padStart(2,"0")}  ${item}`));
  else if (name === "echo") add(args.join(" "));
  else if (name === "matrix" && ["on","off"].includes(args[0])) {
    matrixOn = args[0] === "on"; matrixCanvas.hidden = !matrixOn;
    if (matrixOn) startMatrix(); else cancelAnimationFrame(matrixFrame);
    add(`Matrix rain ${args[0]}.`,"pink");
  } else if (name === "trail" && ["on","off"].includes(args[0])) {
    trailOn = args[0] === "on"; trailCanvas.hidden = !trailOn;
    if (trailOn) startTrail(); else cancelAnimationFrame(trailFrame);
    add(`Pointer trace ${args[0]}.`,"pink");
  } else if (name === "scanlines" && ["on","off"].includes(args[0])) {
    scanlines.hidden = args[0] === "off"; add(`CRT scanlines ${args[0]}.`,"pink");
  } else if (name === "theme" && ["green","pink","amber"].includes(args[0])) {
    document.documentElement.dataset.theme = args[0]; add(`Interface theme: ${args[0].toUpperCase()}`,"ok");
  } else if (name === "email") location.href = "mailto:Lyon.m.heath@gmail.com";
  else if (name === "github") window.open("https://github.com/HeathLyon","_blank","noopener");
  else if (name === "clear" || name === "cls") output.replaceChildren();
  else if (name === "reboot" || name === "boot") boot();
  else if (name === "sudo") add("Permission denied: public portfolio shell.","err");
  else { add(`Command not found: ${name}`,"err"); add("Type “help” for available commands.","dim"); }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!input.value.trim() || busy) return;
  const value = input.value.trim();
  commandHistory.push(value); historyPosition = commandHistory.length; input.value = "";
  run(value);
});
quickButtons.forEach(button => button.addEventListener("click",() => run(button.dataset.command)));
input.addEventListener("keydown", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault(); historyPosition = Math.max(0,historyPosition - 1); input.value = commandHistory[historyPosition] || "";
  } else if (event.key === "ArrowDown") {
    event.preventDefault(); historyPosition = Math.min(commandHistory.length,historyPosition + 1); input.value = historyPosition === commandHistory.length ? "" : commandHistory[historyPosition];
  } else if (event.key === "Tab") {
    event.preventDefault(); const match = completions.find(item => item.startsWith(input.value.toLowerCase())); if (match) input.value = match;
  } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault(); output.replaceChildren();
  }
});

document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute("href"));
  if (!target) return;
  event.preventDefault();
  history.replaceState(null,"",link.getAttribute("href"));
  scroller.scrollTo({top:target.offsetTop,behavior:"smooth"});
});

const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  active = visible.target.id;
  document.querySelectorAll('header nav a,.rail a').forEach(link => link.classList.toggle("active",link.getAttribute("href") === `#${active}`));
},{root:scroller,threshold:[.4,.65]});
document.querySelectorAll(".snap").forEach(section => observer.observe(section));

document.addEventListener("pointermove", event => {
  document.documentElement.style.setProperty("--x",`${event.clientX}px`);
  document.documentElement.style.setProperty("--y",`${event.clientY}px`);
},{passive:true});

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function fitCanvas(canvas,context) {
  const dpr = Math.min(devicePixelRatio || 1,1.5);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
  context.setTransform(dpr,0,0,dpr,0,0);
}
function startMatrix() {
  if (reducedMotion || !matrixOn) return;
  cancelAnimationFrame(matrixFrame);
  const context = matrixCanvas.getContext("2d"), size = 16, glyphs = "01アイウエオカキクケコFPV<>/{}[]";
  let drops = [], last = 0;
  const resize = () => { fitCanvas(matrixCanvas,context); drops = Array.from({length:Math.ceil(innerWidth/size)},() => Math.floor(Math.random() * -60)); };
  const draw = time => {
    matrixFrame = requestAnimationFrame(draw); if (time - last < 75) return; last = time;
    context.fillStyle = "rgba(1,4,3,.1)"; context.fillRect(0,0,innerWidth,innerHeight); context.font = `${size}px monospace`;
    drops.forEach((drop,index) => { context.fillStyle = index % 15 ? "rgba(162,255,47,.34)" : "rgba(255,42,157,.38)"; context.fillText(glyphs[Math.floor(Math.random()*glyphs.length)],index*size,drop*size); drops[index] = drop*size > innerHeight && Math.random() > .98 ? -10 : drop + 1; });
  };
  resize(); matrixCanvas._resizeHandler && removeEventListener("resize",matrixCanvas._resizeHandler); matrixCanvas._resizeHandler = resize; addEventListener("resize",resize); matrixFrame = requestAnimationFrame(draw);
}
const trailPoints = [];
function startTrail() {
  if (reducedMotion || !trailOn) return;
  cancelAnimationFrame(trailFrame);
  const context = trailCanvas.getContext("2d");
  fitCanvas(trailCanvas,context);
  const draw = () => {
    trailFrame = requestAnimationFrame(draw); context.clearRect(0,0,innerWidth,innerHeight);
    trailPoints.forEach(point => point.life -= .05); while (trailPoints[0]?.life <= 0) trailPoints.shift();
    context.save(); context.globalCompositeOperation = "lighter"; context.lineCap = "round";
    for (let index=1; index<trailPoints.length; index++) { const point=trailPoints[index],previous=trailPoints[index-1]; context.beginPath(); context.moveTo(previous.x,previous.y); context.lineTo(point.x,point.y); context.strokeStyle=`rgba(255,42,157,${point.life*.55})`; context.lineWidth=1+point.life*3; context.shadowColor="#ff2a9d"; context.shadowBlur=16; context.stroke(); }
    context.restore();
  };
  trailFrame = requestAnimationFrame(draw);
}
addEventListener("resize",() => { if (trailOn) fitCanvas(trailCanvas,trailCanvas.getContext("2d")); });
addEventListener("pointermove",event => { if (!trailOn) return; trailPoints.push({x:event.clientX,y:event.clientY,life:1}); if (trailPoints.length > 38) trailPoints.shift(); },{passive:true});

if (!reducedMotion) { startMatrix(); startTrail(); }
else { matrixCanvas.hidden = true; trailCanvas.hidden = true; }
boot();