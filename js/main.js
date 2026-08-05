"use strict";

const sections = [
  ["home", "Boot"],
  ["reel", "Flight reel"],
  ["rates", "Rates"],
  ["skills", "Capabilities"],
  ["projects", "Projects"],
  ["contact", "Contact"],
];
const completions = [
  "help",
  "about",
  "status",
  "ls",
  "reel",
  "projects",
  "availability",
  "equipment",
  "360",
  "open 360",
  "play reel",
  "rates",
  "quote",
  "questions",
  "faq",
  "ask why should you hire heath",
  "downloads",
  "yolo",
  "sar",
  "archaeology",
  "scans",
  "skills",
  "work",
  "contact",
  "next",
  "prev",
  "weather",
  "weather precise",
  "flightlog",
  "cert",
  "date",
  "history",
  "matrix on",
  "matrix off",
  "trail on",
  "trail off",
  "scanlines on",
  "scanlines off",
  "theme green",
  "theme pink",
  "theme amber",
  "clear",
  "reboot",
];
const scroller = document.querySelector("#scroller");
const output = document.querySelector("#terminalOutput");
const form = document.querySelector("#terminalForm");
const input = document.querySelector("#terminalInput");
const runButton = document.querySelector("#terminalRun");
const statusLabel = document.querySelector("#terminalStatus");
const terminalConsole = document.querySelector("#terminalConsole");
const terminalToggle = document.querySelector("#terminalToggle");
const quickButtons = [...document.querySelectorAll("[data-command]")];
const matrixCanvas = document.querySelector("#matrixCanvas");
const trailCanvas = document.querySelector("#trailCanvas");
const scanlines = document.querySelector("#scanlines");
const startupScreen = document.querySelector("#startupScreen");
const startupTrack = document.querySelector("#startupTrack");
const startupProgress = document.querySelector("#startupProgress");
const startupPercent = document.querySelector("#startupPercent");
const startupStatus = document.querySelector("#startupStatus");
const heroVideo = document.querySelector("#heroVideo");
const reelVideo = document.querySelector("#reelVideo");
let active = "home",
  busy = true,
  matrixOn = true,
  trailOn = true;
let commandHistory = [],
  historyPosition = 0,
  matrixFrame = 0,
  trailFrame = 0;
let terminalBootStarted = false;
let terminalEngaged = false;
let terminalAutoCollapseTimer = 0;

document.querySelector("#year").textContent = new Date().getFullYear();

const terminalFAQs = Array.isArray(window.terminalFAQs)
  ? window.terminalFAQs
  : [];

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
  quickButtons.forEach((button) => (button.disabled = value));
  statusLabel.textContent = value ? "◌ BOOTING" : "● ONLINE";
  input.placeholder = value ? "initializing..." : "type “help”";
}

function setTerminalCollapsed(collapsed, focusInput = false) {
  if (!terminalConsole || !terminalToggle) return;
  terminalConsole.classList.toggle("is-collapsed", collapsed);
  terminalToggle.setAttribute("aria-expanded", String(!collapsed));
  terminalToggle.textContent = collapsed ? "OPEN CONSOLE" : "MINIMIZE";
  terminalConsole.setAttribute(
    "aria-label",
    collapsed
      ? "Interactive portfolio terminal, collapsed"
      : "Interactive portfolio terminal",
  );

  if (!collapsed && focusInput && !busy) {
    window.setTimeout(() => input.focus(), 180);
  }
}

function scheduleTerminalCollapse() {
  window.clearTimeout(terminalAutoCollapseTimer);
  terminalAutoCollapseTimer = window.setTimeout(
    () => {
      if (!terminalEngaged) setTerminalCollapsed(true);
    },
    reducedMotion ? 900 : 2400,
  );
}

function boot() {
  output.replaceChildren();
  setBusy(true);
  const sequence = [
    ["initialize --portfolio --single-page", "cmd"],
    ["[SUCCESS] flight archive mounted", "ok"],
    ["[SUCCESS] project modules indexed", "ok"],
    ["[SUCCESS] question database mounted", "ok"],
    ["[SUCCESS] snap navigation synchronized", "ok"],
    ["[INFO] ask: availability / equipment / 360 / play reel", "dim"],
    ["[READY] shell active — type “help”", "pink"],
  ];
  sequence.forEach(([text, tone], index) =>
    setTimeout(
      () => {
        add(text, tone);
        if (index === sequence.length - 1) {
          setBusy(false);
          scheduleTerminalCollapse();
        }
      },
      250 + index * 280,
    ),
  );
}

function normalizeQuestion(value) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function listQuestions() {
  add("ASKABLE QUESTIONS", "ok");

  if (!terminalFAQs.length) {
    add("No questions have been added yet.", "dim");
    return;
  }

  terminalFAQs.forEach((entry, index) => {
    add(`${String(index + 1).padStart(2, "0")}  ${entry.question}`, "pink");
  });
  add("Type: ask <question> — or type a listed question directly.", "dim");
}

function answerQuestion(rawQuestion, showMiss = true) {
  const normalized = normalizeQuestion(rawQuestion).replace(
    /^(ask|question|faq)\s+/,
    "",
  );

  const match = terminalFAQs.find((entry) => {
    const patterns = [entry.question, ...(entry.aliases || [])]
      .map(normalizeQuestion)
      .filter(Boolean);

    return patterns.some(
      (pattern) =>
        normalized === pattern ||
        (pattern.length >= 8 && normalized.includes(pattern)),
    );
  });

  if (!match) {
    if (showMiss) {
      add("I do not have an answer for that question yet.", "err");
      add("Type “questions” to see what I can answer.", "dim");
    }
    return false;
  }

  add(`[ANSWER] ${match.question}`, "ok");
  const lines = Array.isArray(match.answer) ? match.answer : [match.answer];
  lines.filter(Boolean).forEach((line, index) => {
    add(line, index === 0 ? "pink" : "");
  });
  return true;
}

function go(target) {
  const routes = {
    home: "home",
    boot: "home",
    reel: "reel",
    drone: "reel",
    projects: "projects",
    scans: "projects",
    archaeology: "projects",
    skills: "skills",
    work: "skills",
    rates: "rates",
    pricing: "rates",
    quote: "rates",
    contact: "contact",
  };
  const route = routes[target];
  if (!route) return add(`Unknown destination: ${target}`, "err");
  const section = document.getElementById(route);
  add(`[OPEN] #${route}`, "pink");
  history.replaceState(null, "", `#${route}`);
  scroller.scrollTo({ top: section.offsetTop, behavior: "smooth" });
}

function openPage(target) {
  const pages = {
    downloads: "downloads.html",
    yolo: "Yollo.html",
    sar: "sar-project.html",
    archaeology: "archaeology-project.html",
    360: "360.html",
  };
  const page = pages[target];
  if (!page) return false;
  add(`[OPEN] ${page}`, "pink");
  window.setTimeout(() => {
    window.location.href = page;
  }, 180);
  return true;
}

function playReel() {
  add("[PLAY] loading flight reel", "pink");
  go("reel");
  window.setTimeout(() => {
    reelVideo?.play().catch(() => {
      add("Press play in the reel player to begin with audio.", "dim");
    });
  }, 650);
}

function step(direction) {
  const index = Math.max(
    0,
    sections.findIndex(([id]) => id === active),
  );
  go(
    sections[Math.max(0, Math.min(sections.length - 1, index + direction))][0],
  );
}

async function weather(precise) {
  setBusy(true);
  add(
    precise
      ? "[INFO] requesting browser location..."
      : "[INFO] checking Provo flight conditions...",
    "dim",
  );
  try {
    let lat = 40.2338,
      lon = -111.6585,
      place = "PROVO, UT";
    if (precise) {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation)
          return reject(new Error("location unavailable"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
        });
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      place = "DEVICE LOCATION";
    }
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`,
    );
    if (!response.ok) throw new Error(`weather link ${response.status}`);
    const { current } = await response.json();
    add(`[SUCCESS] WEATHER LINK: ${place}`, "ok");
    add(
      `${Math.round(current.temperature_2m)}°F | FEELS ${Math.round(current.apparent_temperature)}°F | WIND ${Math.round(current.wind_speed_10m)} MPH`,
      "pink",
    );
  } catch (error) {
    add(`[ERROR] ${error.message || "weather unavailable"}`, "err");
  }
  setBusy(false);
}

async function run(raw) {
  const command = raw.trim();
  if (!command || busy) return;
  add(`root@heath:~$ ${command}`, "cmd");
  const [name, ...args] = command.toLowerCase().split(/\s+/);
  if (name === "help" || name === "?") {
    [
      "AVAILABLE COMMANDS",
      "about / status       operator and system data",
      "ls / open <module>   inspect page modules",
      "next / prev          move one snap section",
      "reel / projects      open featured work",
      "availability         current project availability",
      "equipment            flight and capture equipment",
      "360 / open 360       360 video and tour information",
      "play reel            open and start the flight reel",
      "rates / quote        starting rates and direct quote",
      "questions / faq      list questions I can answer",
      "ask <question>       ask about Heath in plain language",
      "downloads / yolo     open project library or demo",
      "sar / archaeology    open research case studies",
      "skills / contact     capability or contact",
      "flightlog / cert     mission and credential data",
      "weather [precise]    flight conditions",
      "theme green|pink|amber",
      "matrix / trail / scanlines on|off",
      "date / history / clear / reboot",
    ].forEach((line, index) => add(line, index ? "" : "ok"));
  } else if (name === "about" || name === "whoami") {
    add("HEATH LYON // FAA PART 107 REMOTE PILOT", "ok");
    add(
      "FPV cinematography + custom flight systems + computer vision + embedded electronics + interactive 3D.",
    );
  } else if (name === "status") {
    add("PORTFOLIO........ ONLINE", "ok");
    add("FLIGHT SYSTEMS... READY", "ok");
    add(`ACTIVE MODULE..... ${active.toUpperCase()}`, "pink");
    add(`LOCAL CLOCK....... ${new Date().toLocaleString()}`);
  } else if (name === "questions" || (name === "faq" && !args.length)) {
    listQuestions();
  } else if (name === "availability") {
    answerQuestion("What kind of work is Heath available for?");
  } else if (name === "equipment" || name === "gear") {
    answerQuestion("What equipment does Heath use?");
  } else if (name === "360" || name === "tour" || name === "tours") {
    answerQuestion("Does Heath offer 360 video and tours?");
  } else if (name === "play" && args[0] === "reel") {
    playReel();
  } else if (name === "ask" || name === "question") {
    if (args.length) answerQuestion(args.join(" "));
    else listQuestions();
  } else if (name === "ls" || name === "dir") {
    [
      "reel/",
      "projects/",
      "questions/",
      "downloads/",
      "360-tours/",
      "yolo-demo/",
      "sar-research/",
      "archaeology-3d/",
      "skills/",
      "rates/",
      "work-history/",
      "contact/",
    ].forEach((item) => add(item, "pink"));
  } else if (
    [
      "home",
      "reel",
      "drone",
      "projects",
      "scans",
      "skills",
      "work",
      "rates",
      "pricing",
      "quote",
      "contact",
    ].includes(name)
  ) {
    if (name === "reel") playReel();
    else go(name);
  } else if (
    ["downloads", "yolo", "sar", "archaeology", "360"].includes(name)
  ) {
    openPage(name);
  } else if (["open", "cd", "goto"].includes(name)) {
    if (!args[0])
      add(
        "Usage: open <reel|projects|downloads|360|yolo|sar|archaeology|skills|rates|contact>",
        "err",
      );
    else if (!openPage(args[0])) go(args[0]);
  } else if (name === "next") step(1);
  else if (name === "prev") step(-1);
  else if (name === "weather") await weather(args[0] === "precise");
  else if (name === "flightlog") {
    add("2026 // HOMESTEAD-MIAMI AUDI F1 PRODUCTION", "ok");
    add("2026—NOW // INDEPENDENT DRONE PILOT — THINK GLOBAL MEDIA");
    add("PLATFORMS // CUSTOM FPV / MAVIC / CINELIFTER", "pink");
  } else if (name === "cert")
    add("FAA PART 107 REMOTE PILOT CERTIFICATE // ACTIVE", "ok");
  else if (name === "date" || name === "time")
    add(new Date().toLocaleString(), "ok");
  else if (name === "history")
    commandHistory.forEach((item, index) =>
      add(`${String(index + 1).padStart(2, "0")}  ${item}`),
    );
  else if (name === "echo") add(args.join(" "));
  else if (name === "matrix" && ["on", "off"].includes(args[0])) {
    matrixOn = args[0] === "on";
    matrixCanvas.hidden = !matrixOn;
    if (matrixOn) startMatrix();
    else cancelAnimationFrame(matrixFrame);
    add(`Matrix rain ${args[0]}.`, "pink");
  } else if (name === "trail" && ["on", "off"].includes(args[0])) {
    trailOn = args[0] === "on";
    trailCanvas.hidden = !trailOn;
    if (trailOn) startTrail();
    else cancelAnimationFrame(trailFrame);
    add(`Pointer trace ${args[0]}.`, "pink");
  } else if (name === "scanlines" && ["on", "off"].includes(args[0])) {
    scanlines.hidden = args[0] === "off";
    add(`CRT scanlines ${args[0]}.`, "pink");
  } else if (name === "theme" && ["green", "pink", "amber"].includes(args[0])) {
    document.documentElement.dataset.theme = args[0];
    add(`Interface theme: ${args[0].toUpperCase()}`, "ok");
  } else if (name === "email") location.href = "mailto:Lyon.m.heath@gmail.com";
  else if (name === "github")
    window.open("https://github.com/HeathLyon", "_blank", "noopener");
  else if (name === "clear" || name === "cls") output.replaceChildren();
  else if (name === "reboot" || name === "boot") boot();
  else if (name === "sudo")
    add("Permission denied: public portfolio shell.", "err");
  else if (answerQuestion(command, false)) {
    // Natural-language questions are answered before showing command errors.
  } else {
    add(`Command not found: ${name}`, "err");
    add(
      "Type “help” for commands or “questions” for available answers.",
      "dim",
    );
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!input.value.trim() || busy) return;
  const value = input.value.trim();
  commandHistory.push(value);
  historyPosition = commandHistory.length;
  input.value = "";
  run(value);
});
quickButtons.forEach((button) =>
  button.addEventListener("click", () => run(button.dataset.command)),
);
terminalToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  terminalEngaged = true;
  window.clearTimeout(terminalAutoCollapseTimer);
  const willOpen = terminalConsole.classList.contains("is-collapsed");
  setTerminalCollapsed(!willOpen, willOpen);
});
terminalConsole?.addEventListener("click", () => {
  if (!terminalConsole.classList.contains("is-collapsed")) return;
  terminalEngaged = true;
  window.clearTimeout(terminalAutoCollapseTimer);
  setTerminalCollapsed(false, true);
});
terminalConsole?.addEventListener("pointerdown", () => {
  if (terminalConsole.classList.contains("is-collapsed")) return;
  terminalEngaged = true;
  window.clearTimeout(terminalAutoCollapseTimer);
});
input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    historyPosition = Math.max(0, historyPosition - 1);
    input.value = commandHistory[historyPosition] || "";
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    historyPosition = Math.min(commandHistory.length, historyPosition + 1);
    input.value =
      historyPosition === commandHistory.length
        ? ""
        : commandHistory[historyPosition];
  } else if (event.key === "Tab") {
    event.preventDefault();
    const match = completions.find((item) =>
      item.startsWith(input.value.toLowerCase()),
    );
    if (match) input.value = match;
  } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    output.replaceChildren();
  } else if (event.key === "Escape") {
    input.blur();
    setTerminalCollapsed(true);
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute("href"));
  if (!target) return;
  event.preventDefault();
  history.replaceState(null, "", link.getAttribute("href"));
  scroller.scrollTo({ top: target.offsetTop, behavior: "smooth" });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    active = visible.target.id;
    document
      .querySelectorAll("header nav a,.rail a")
      .forEach((link) =>
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${active}`,
        ),
      );
    if (heroVideo?.classList.contains("is-ready") && !reducedMotion) {
      if (active === "home") heroVideo.play().catch(() => {});
      else heroVideo.pause();
    }
  },
  { root: scroller, threshold: [0.4, 0.65] },
);
document
  .querySelectorAll(".snap")
  .forEach((section) => observer.observe(section));

document.addEventListener(
  "pointermove",
  (event) => {
    document.documentElement.style.setProperty("--x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--y", `${event.clientY}px`);
  },
  { passive: true },
);

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function startTerminalBoot() {
  if (terminalBootStarted) return;
  terminalBootStarted = true;
  boot();
}

function startStartupSequence() {
  if (!startupScreen) {
    startTerminalBoot();
    return;
  }

  const startedAt = performance.now();
  const minimumDuration = reducedMotion ? 120 : 1650;
  const maximumDuration = 7000;
  const statusMessages = [
    "VIDEO LINK // CONNECTING",
    "DECODING BACKGROUND STREAM",
    "SYNCING FLIGHT INTERFACE",
    "MOUNTING PORTFOLIO MODULES",
  ];
  let displayedProgress = 4;
  let statusIndex = 0;
  let finishing = false;

  function paintProgress(value) {
    displayedProgress = Math.max(
      displayedProgress,
      Math.min(100, Math.round(value)),
    );
    startupProgress.style.width = `${displayedProgress}%`;
    startupPercent.textContent = `${String(displayedProgress).padStart(2, "0")}%`;
    startupTrack.setAttribute("aria-valuenow", String(displayedProgress));
  }

  paintProgress(displayedProgress);

  const progressTimer = window.setInterval(() => {
    if (finishing || displayedProgress >= 88) return;
    paintProgress(displayedProgress + 1 + Math.random() * 4);
  }, 95);

  const statusTimer = window.setInterval(() => {
    if (finishing) return;
    statusIndex = Math.min(statusIndex + 1, statusMessages.length - 1);
    startupStatus.textContent = statusMessages[statusIndex];
  }, 390);

  function finishStartup(message) {
    if (finishing) return;
    finishing = true;
    window.clearInterval(progressTimer);
    window.clearInterval(statusTimer);
    paintProgress(100);
    startupStatus.textContent = message;

    const elapsed = performance.now() - startedAt;
    window.setTimeout(
      () => {
        startupScreen.classList.add("is-complete");
        startupScreen.setAttribute("aria-hidden", "true");
        document.body.classList.remove("is-loading");
        startTerminalBoot();
        window.setTimeout(() => {
          startupScreen.hidden = true;
        }, 650);
      },
      Math.max(0, minimumDuration - elapsed),
    );
  }

  function revealVideo() {
    if (!heroVideo) return;
    heroVideo.classList.add("is-ready");
    heroVideo.play().catch(() => {});
    finishStartup("VIDEO READY // ENTERING");
  }

  function useFallback() {
    finishStartup("FALLBACK READY // ENTERING");
  }

  if (reducedMotion) {
    heroVideo?.pause();
    finishStartup("REDUCED MOTION // READY");
    return;
  }

  if (!heroVideo) {
    useFallback();
    return;
  }

  const videoSource = heroVideo.querySelector("source");
  heroVideo.muted = true;
  heroVideo.addEventListener("canplay", revealVideo, { once: true });
  heroVideo.addEventListener("error", useFallback, { once: true });
  videoSource?.addEventListener("error", useFallback, { once: true });
  heroVideo.addEventListener("progress", () => {
    if (!heroVideo.duration || !heroVideo.buffered.length || finishing) return;
    const bufferedEnd = heroVideo.buffered.end(heroVideo.buffered.length - 1);
    paintProgress(Math.min(88, (bufferedEnd / heroVideo.duration) * 88));
  });

  if (heroVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    revealVideo();
  } else {
    heroVideo.load();
  }

  window.setTimeout(() => {
    if (!finishing) useFallback();
  }, maximumDuration);
}

function fitCanvas(canvas, context) {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function startMatrix() {
  if (reducedMotion || !matrixOn) return;
  cancelAnimationFrame(matrixFrame);
  const context = matrixCanvas.getContext("2d"),
    size = 16,
    glyphs = "01アイウエオカキクケコFPV<>/{}[]";
  let drops = [],
    last = 0;
  const resize = () => {
    fitCanvas(matrixCanvas, context);
    drops = Array.from({ length: Math.ceil(innerWidth / size) }, () =>
      Math.floor(Math.random() * -60),
    );
  };
  const draw = (time) => {
    matrixFrame = requestAnimationFrame(draw);
    if (time - last < 75) return;
    last = time;
    context.fillStyle = "rgba(1,4,3,.1)";
    context.fillRect(0, 0, innerWidth, innerHeight);
    context.font = `${size}px monospace`;
    drops.forEach((drop, index) => {
      context.fillStyle =
        index % 15 ? "rgba(162,255,47,.34)" : "rgba(255,42,157,.38)";
      context.fillText(
        glyphs[Math.floor(Math.random() * glyphs.length)],
        index * size,
        drop * size,
      );
      drops[index] =
        drop * size > innerHeight && Math.random() > 0.98 ? -10 : drop + 1;
    });
  };
  resize();
  matrixCanvas._resizeHandler &&
    removeEventListener("resize", matrixCanvas._resizeHandler);
  matrixCanvas._resizeHandler = resize;
  addEventListener("resize", resize);
  matrixFrame = requestAnimationFrame(draw);
}
const trailPoints = [];
function startTrail() {
  if (reducedMotion || !trailOn) return;
  cancelAnimationFrame(trailFrame);
  const context = trailCanvas.getContext("2d");
  fitCanvas(trailCanvas, context);
  const draw = () => {
    trailFrame = requestAnimationFrame(draw);
    context.clearRect(0, 0, innerWidth, innerHeight);
    trailPoints.forEach((point) => (point.life -= 0.05));
    while (trailPoints[0]?.life <= 0) trailPoints.shift();
    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    for (let index = 1; index < trailPoints.length; index++) {
      const point = trailPoints[index],
        previous = trailPoints[index - 1];
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(point.x, point.y);
      context.strokeStyle = `rgba(255,42,157,${point.life * 0.55})`;
      context.lineWidth = 1 + point.life * 3;
      context.shadowColor = "#ff2a9d";
      context.shadowBlur = 16;
      context.stroke();
    }
    context.restore();
  };
  trailFrame = requestAnimationFrame(draw);
}
addEventListener("resize", () => {
  if (trailOn) fitCanvas(trailCanvas, trailCanvas.getContext("2d"));
});
addEventListener(
  "pointermove",
  (event) => {
    if (!trailOn) return;
    trailPoints.push({ x: event.clientX, y: event.clientY, life: 1 });
    if (trailPoints.length > 38) trailPoints.shift();
  },
  { passive: true },
);

if (!reducedMotion) {
  startMatrix();
  startTrail();
} else {
  matrixCanvas.hidden = true;
  trailCanvas.hidden = true;
}
startStartupSequence();