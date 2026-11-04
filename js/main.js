/* Existing main.js with homepage updates and guarded initialization. */
(() => {
  "use strict";
  if (window.HeathFPVMainInitialized) return;
  window.HeathFPVMainInitialized = true;
  const hasExternal = (file) => [...document.scripts].some((script) => {
    if (!script.src) return false;
    return new URL(script.src, document.baseURI).pathname.endsWith(`/js/${file}`);
  });
  // Older pages retain the original terminal/navigation implementation.
  // Updated terminal pages already load their own terminal.js.
  if (document.querySelector("#terminalForm") && !hasExternal("terminal.js") && !document.body.classList.contains("terminal-page")) {
    (function initializeLegacyPortfolio() {
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
    })();
    return;
  }
  // Revised homepage and standalone pages use null-safe shared behavior.
/* Search-engine structured data, kept with the external script. */
(() => {
  if (!document.querySelector("#home-title")) return;
  const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://heathfpv.com/#website",
      "url": "https://heathfpv.com/",
      "name": "Heath Lyon FPV",
      "inLanguage": "en-US"
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://heathfpv.com/#business",
      "name": "Heath Lyon FPV",
      "url": "https://heathfpv.com/",
      "image": "https://heathfpv.com/images/utah-county-fpv-drone-tour.webp",
      "email": "mailto:Lyon.m.heath@gmail.com",
      "description": "FAA Part 107 drone pilot providing FPV video, aerial media, and 360 drone tours in Utah County, Utah.",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Provo",
        "addressRegion": "UT",
        "addressCountry": "US"
      },
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Utah County, Utah"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Drone media services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "360 Drone Tours"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "FPV Drone Video"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Aerial Photography and Video"
            }
          }
        ]
      },
      "sameAs": [
        "https://www.youtube.com/@SkyLensProvo",
        "https://instagram.com/skylensprovo",
        "https://github.com/HeathLyon"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://heathfpv.com/#heath-lyon",
      "name": "Heath Lyon",
      "url": "https://heathfpv.com/",
      "jobTitle": "FAA Part 107 Drone Pilot",
      "worksFor": {
        "@id": "https://heathfpv.com/#business"
      }
    }
  ]
};
  const node = document.createElement("script");
  node.type = "application/ld+json";
  node.textContent = JSON.stringify(data);
  document.head.append(node);
})();


/* js/intro.js */
/* Progress tracks homepage readiness, not download bytes or future game assets. */
(() => {
  "use strict";
  const intro = document.querySelector("#logoIntro");
  if (!intro) return;
  const shell = document.querySelector(".shell");
  const progress = intro.querySelector("progress");
  const percent = intro.querySelector("[data-load-percent]");
  const status = intro.querySelector("[data-load-status]");
  const video = document.querySelector("#heroVideo");
  const logo = intro.querySelector("img");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const started = performance.now();
  const minimum = reduced ? 0 : 1000;
  const needsVideo = !location.hash || ["#home", "#mainContent"].includes(location.hash);
  const tasks = new Map();
  const cleanups = [];
  let closing = false, closed = false;
  let finishTimer, hideTimer;
  intro.hidden = false;
  shell.inert = true;
  document.body.classList.add("intro-loading");

  function paint(message) {
    const value = [...tasks.values()].reduce((sum, weight) => sum + weight, 0);
    progress.value = value;
    percent.textContent = `${value}%`;
    status.textContent = message;
  }
  function release() {
    const focusedInside = intro.contains(document.activeElement);
    closed = true;
    shell.inert = false;
    document.body.classList.remove("intro-loading");
    intro.classList.add("is-complete");
    intro.setAttribute("aria-hidden", "true");
    if (focusedInside) document.querySelector("#mainContent")?.focus({ preventScroll: true });
    hideTimer = setTimeout(() => { intro.hidden = true; }, reduced ? 0 : 220);
  }
  function close(immediate = false) {
    if (closed || (closing && !immediate)) return;
    closing = true;
    clearTimeout(fallback);
    clearTimeout(finishTimer);
    cleanups.forEach((cleanup) => cleanup());
    finishTimer = setTimeout(release, immediate ? 0 : Math.max(0, minimum - (performance.now() - started)));
  }
  function complete(name, weight, message) {
    if (closing || closed || tasks.has(name)) return;
    tasks.set(name, weight);
    paint(message);
    if (tasks.size === 4) {
      paint("Portfolio ready");
      close();
    }
  }
  function listen(target, name, handler) {
    if (!target) return;
    target.addEventListener(name, handler, { once: true });
    cleanups.push(() => target.removeEventListener(name, handler));
  }
  // Stalled optional media or fonts must never trap visitors behind the intro.
  const fallback = setTimeout(() => {
    status.textContent = "Opening portfolio with available media…";
    close(true);
  }, 4500);
  intro.querySelector("[data-skip-intro]").addEventListener("click", () => close(true));
  paint("Preparing homepage…");

  if (document.readyState !== "loading") complete("page", 20, "Homepage ready");
  else listen(document, "DOMContentLoaded", () => complete("page", 20, "Homepage ready"));

  if (document.fonts?.ready) {
    document.fonts.ready.then(
      () => complete("fonts", 20, "Typography ready"),
      () => complete("fonts", 20, "Using fallback typography"),
    );
  } else complete("fonts", 20, "Typography ready");

  if (logo?.decode) {
    logo.decode().then(
      () => complete("logo", 20, "Brand assets ready"),
      () => complete("logo", 20, "Continuing without logo preview"),
    );
  } else if (!logo || logo.complete) complete("logo", 20, "Brand assets ready");
  else {
    listen(logo, "load", () => complete("logo", 20, "Brand assets ready"));
    listen(logo, "error", () => complete("logo", 20, "Continuing without logo preview"));
  }

  if (!needsVideo) complete("video", 40, "Project section ready");
  else if (reduced || !video || video.error) complete("video", 40, "Background image ready");
  else if (video.readyState >= 3) complete("video", 40, "Background video ready");
  else {
    listen(video, "canplay", () => complete("video", 40, "Background video ready"));
    const usePoster = () => complete("video", 40, "Background image ready — video unavailable");
    listen(video, "error", usePoster);
    listen(video.querySelector("source"), "error", usePoster);
  }

  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearTimeout(fallback);
    clearTimeout(finishTimer);
    clearTimeout(hideTimer);
    cleanups.forEach((cleanup) => cleanup());
    closing = closed = true;
    intro.hidden = true;
    shell.inert = false;
    document.body.classList.remove("intro-loading");
  });
})();




/* js/main.js */
/* Shared navigation, video, and decorative effects. No terminal dependencies. */
(() => {
  "use strict";
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)");
  const root = document.documentElement;
  document.querySelectorAll("#year, [data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const hero = document.querySelector("#heroVideo");
  const reel = document.querySelector("#reelVideo");
  let homeVisible = true;
  function syncVideo() {
    if (!hero) return;
    if (motion.matches || document.hidden || !homeVisible) hero.pause();
    else hero.play().catch(() => {}); // Poster remains visible if autoplay fails.
  }
  hero?.addEventListener("canplay", () => hero.classList.add("is-ready"), { once: true });
  if (hero?.readyState >= 3) hero.classList.add("is-ready");
  const sections = [...document.querySelectorAll("main section[id]")];
  if ("IntersectionObserver" in window && sections.length) {
    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        if (entry.target.id === "home") {
          homeVisible = entry.isIntersecting;
          syncVideo();
        }
        if (entry.target.id === "reel" && !entry.isIntersecting) reel?.pause();
      });
      const active = [...visible].sort((a, b) => b[1] - a[1])[0];
      if (!active || !active[1]) return;
      document.querySelectorAll('header nav a[href^="#"]').forEach((link) => {
        const current = link.hash === `#${active[0]}`;
        link.classList.toggle("active", current);
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { threshold: [0, .15, .35, .6], rootMargin: "-110px 0px -15% 0px" });
    sections.forEach((section) => observer.observe(section));
  }
  // Native anchors provide deep links, browser history, and a no-JS fallback.

  const matrix = document.querySelector("#matrixCanvas");
  const trail = document.querySelector("#trailCanvas");
  const matrixContext = matrix?.getContext("2d");
  const trailContext = trail?.getContext("2d");
  const enabled = { matrix: true, trail: true };
  let matrixFrame = 0, trailFrame = 0, lastMatrix = 0;
  let drops = [], points = [];
  const glyphs = "01アイウエオカキクケコFPV<>/{}[]";

  function fit(canvas, context) {
    if (!canvas || !context) return;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function resize() {
    fit(matrix, matrixContext);
    fit(trail, trailContext);
    drops = Array.from({ length: Math.ceil(innerWidth / 16) }, () => -Math.random() * 60);
    points = [];
  }
  function drawMatrix(time) {
    if (time - lastMatrix >= 75) {
      lastMatrix = time;
      matrixContext.fillStyle = "rgba(1,4,3,.1)";
      matrixContext.fillRect(0, 0, innerWidth, innerHeight);
      matrixContext.font = "16px monospace";
      drops.forEach((drop, index) => {
        matrixContext.fillStyle = index % 15 ? "rgba(162,255,47,.34)" : "rgba(255,42,157,.38)";
        matrixContext.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], index * 16, drop * 16);
        drops[index] = drop * 16 > innerHeight && Math.random() > .98 ? -10 : drop + 1;
      });
    }
    matrixFrame = requestAnimationFrame(drawMatrix);
  }
  let lastTrail = 0;
  function drawTrail(time) {
    const decay = Math.min((time - (lastTrail || time)) / 320, .15);
    lastTrail = time;
    trailContext.clearRect(0, 0, innerWidth, innerHeight);
    points.forEach((point) => point.life -= decay);
    points = points.filter((point) => point.life > 0);
    trailContext.save();
    trailContext.globalCompositeOperation = "lighter";
    trailContext.lineCap = "round";
    points.slice(1).forEach((point, index) => {
      const previous = points[index];
      trailContext.beginPath();
      trailContext.moveTo(previous.x, previous.y);
      trailContext.lineTo(point.x, point.y);
      trailContext.strokeStyle = `rgba(255,42,157,${point.life * .5})`;
      trailContext.lineWidth = 1 + point.life * 2;
      trailContext.shadowColor = "#ff2a9d";
      trailContext.shadowBlur = 10;
      trailContext.stroke();
    });
    trailContext.restore();
    trailFrame = points.length ? requestAnimationFrame(drawTrail) : 0;
    if (!trailFrame) lastTrail = 0;
  }
  function syncEffects() {
    cancelAnimationFrame(matrixFrame);
    cancelAnimationFrame(trailFrame);
    matrixFrame = trailFrame = lastTrail = 0;
    points = [];
    trailContext?.clearRect(0, 0, innerWidth, innerHeight);
    const animate = !motion.matches && !document.hidden;
    if (matrix) matrix.hidden = !animate || !enabled.matrix;
    if (trail) trail.hidden = !animate || !enabled.trail || !finePointer.matches;
    if (animate && enabled.matrix && matrixContext) matrixFrame = requestAnimationFrame(drawMatrix);
    syncVideo();
  }
  window.PortfolioEffects = {
    set(name, value) {
      if (!Object.hasOwn(enabled, name)) return;
      enabled[name] = Boolean(value);
      syncEffects();
    },
  };
  addEventListener("resize", resize, { passive: true });
  addEventListener("pointermove", (event) => {
    if (motion.matches || !finePointer.matches || document.hidden) return;
    root.style.setProperty("--x", `${event.clientX}px`);
    root.style.setProperty("--y", `${event.clientY}px`);
    if (!trailContext || !enabled.trail) return;
    points.push({ x: event.clientX, y: event.clientY, life: 1 });
    if (points.length > 30) points.shift();
    if (!trailFrame) trailFrame = requestAnimationFrame(drawTrail);
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    syncEffects();
    if (document.hidden) reel?.pause();
  });
  motion.addEventListener("change", syncEffects);
  finePointer.addEventListener("change", syncEffects);
  resize();
  syncEffects();
})();





  // Avoid duplicate search listeners on pages with the separate search script.
  if (!hasExternal("search.js")) {
/* js/search-index.js */
/* Curated public destinations. Update this list when adding or renaming a page. */
window.portfolioSearchIndex = [
  { title: "Drone filming rates", url: "index.html#rates", description: "Full day from $600, half day from $400, and same-day rush from $800.", keywords: ["pricing", "prices", "cost", "quote", "booking", "100 upfront", "how much do you charge", "two day turnaround", "day rate", "half-day"] },
  { title: "FPV drone video reel", url: "index.html#reel", description: "Watch cinematic FPV footage, tracking shots, and production work.", keywords: ["portfolio", "film", "video", "aerial", "cinematography", "work", "cinelifter"] },
  { title: "360 drone tours", url: "utah-county-drone-tours.html", description: "Immersive aerial tours for properties and locations in Utah County.", keywords: ["virtual", "real estate", "property", "panorama", "video", "services"] },
  { title: "Contact & booking", url: "contact-form.html", description: "Share your location, shoot date, and deliverables to request a quote.", keywords: ["email", "heath", "hire", "availability", "book", "quote"] },
  { title: "About Heath Lyon", url: "index.html#projects", description: "Meet the Provo-based FAA Part 107 pilot, builder, and developer.", keywords: ["bio", "selfie", "certification", "who", "location", "utah", "projects"] },
  { title: "Full-day drone shoot — $600 starting", url: "index.html#rates", description: "10 hours of coverage with finished aerial photos or edited video.", keywords: ["day rate", "pricing", "cost", "600", "full day"] },
  { title: "Half-day drone shoot — $400 starting", url: "index.html#rates", description: "5 hours of coverage with finished aerial photos or edited video.", keywords: ["day rate", "pricing", "cost", "400", "half day"] },
  { title: "Same-day rush — $800 starting", url: "index.html#rates", description: "Full-day coverage with same-day delivery of your finished video.", keywords: ["urgent", "fast", "rush delivery", "pricing", "800"] },
  { title: "Interactive 360 tour demo", url: "360.html", description: "Explore connected panoramic scenes and 360 flight media.", keywords: ["virtual", "immersive", "panorama", "demo", "video"] },
  { title: "Search & rescue payload research", url: "sar-project.html", description: "RF sensing, phone detection, and modular drone payload concepts.", keywords: ["SAR", "research", "rescue", "sensor", "phone", "RF", "projects"] },
  { title: "YOLO fall detection", url: "Yollo.html", description: "A computer vision prototype with pose tracking and fall alerts.", keywords: ["yollo", "AI", "OpenCV", "Python", "tracking", "privacy", "projects"] },
  { title: "Archaeology 3D scans", url: "archaeology-project.html", description: "Interactive viewers for scanned sites, artifacts, and field records.", keywords: ["GLB", "GLTF", "Three.js", "archive", "3d", "projects"] },
  { title: "Project downloads", url: "downloads.html", description: "Find source packages, demos, and project briefs.", keywords: ["code", "software", "files", "download", "source", "library"] },
  { title: "Drone Rush — play the browser game", url: "drone-rush.html", description: "Race three drone courses in your browser. Mouse controls, solo time trials, and private rooms with a connected race server.", keywords: ["game", "Godot", "gdot", "racing", "drone rush", "play", "browser", "projects"] },
  { title: "Interactive portfolio terminal", url: "terminal.html", description: "Ask about equipment, services, and projects using the command console.", keywords: ["terminal", "console", "commands", "FAQ", "questions", "help"] },
];




/* js/search.js */
/* Local, curated site search. Add pages and keywords in search-index.js. */
(() => {
  "use strict";
  const dialog = document.querySelector("#siteSearch");
  if (!dialog) return;
  const field = dialog.querySelector("#siteSearchInput");
  const list = dialog.querySelector("#siteSearchResults");
  const status = dialog.querySelector("#siteSearchStatus");
  const form = dialog.querySelector("form");
  const entries = Array.isArray(window.portfolioSearchIndex) ? window.portfolioSearchIndex : [];
  const normalize = (text) => String(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const indexed = entries.map((entry) => ({ ...entry,
    titleText: normalize(entry.title),
    text: normalize([entry.title, entry.description, ...(entry.keywords || [])].join(" ")),
  }));
  let opener;
  function render() {
    const query = normalize(field.value);
    const tokens = query.split(" ").filter(Boolean);
    const matches = !query ? indexed.slice(0, 6) : indexed
      .filter((entry) => tokens.every((token) => entry.text.includes(token)))
      .map((entry) => ({ ...entry, score: (entry.titleText.includes(query) ? 10 : 0) + tokens.filter((token) => entry.titleText.includes(token)).length }))
      .sort((a, b) => b.score - a.score);
    list.replaceChildren();
    matches.forEach((entry) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      // Entries are local, hand-maintained destinations, never user-provided URLs.
      link.href = entry.url;
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const description = document.createElement("span");
      description.textContent = entry.description;
      link.append(title, description);
      item.append(link);
      list.append(item);
    });
    status.textContent = !query ? "Popular destinations" : matches.length
      ? `${matches.length} result${matches.length === 1 ? "" : "s"} for “${field.value.trim()}”`
      : `No results for “${field.value.trim()}”. Try “rates”, “FPV”, “360”, or “contact”.`;
  }
  function open(button) {
    opener = button || document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("search-open");
    render();
    field.focus();
    field.select();
  }
  document.querySelectorAll("[data-open-search]").forEach((button) => {
    button.addEventListener("click", () => open(button));
  });
  dialog.querySelector("[data-close-search]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.classList.remove("search-open");
    opener?.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  field.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    list.querySelector("a")?.focus();
  });
  list.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    dialog.close();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      open();
    }
  });
})();


  }
})();


const GODOT_EXPORT_CONFIG = {"args": [], "canvasResizePolicy": 2, "emscriptenPoolSize": 8, "ensureCrossOriginIsolationHeaders": true, "executable": "index", "experimentalVK": false, "fileSizes": {"index.pck": 59064, "index.wasm": 38057390}, "focusCanvas": true, "gdextensionLibs": [], "godotPoolSize": 4};
/* Drone Rush: site launch controls and the exported-engine loading screen. */
(() => {
  "use strict";
  // Set once after deploying the relay, e.g. "wss://your-race-server.example/ws".
  const DRONE_RUSH_RELAY_URL = "";

  if (document.body.classList.contains("godot-game")) {
    bootExport();
    return;
  }
  const launch = document.querySelector("#gameLaunch");
  if (!launch) return;
  const mount = document.querySelector("#gameMount");
  const start = document.querySelector("#gameStart");
  const status = document.querySelector("#gameLoadStatus");
  const fullscreen = document.querySelector("#gameFullscreen");
  const close = document.querySelector("#gameClose");
  const direct = document.querySelector("#gameDirectLink");
  let frame = null;
  let ready = false;
  let relay = "";
  if (DRONE_RUSH_RELAY_URL) {
    try {
      const url = new URL(DRONE_RUSH_RELAY_URL);
      if (url.protocol === "wss:") relay = url.href;
    } catch { /* A bad optional setting must never block solo play. */ }
  }
  const gameURL = new URL("games/drone-rush/index.html", location.href);
  if (relay) {
    gameURL.searchParams.set("relay", relay);
    document.querySelector("#relayStatus").textContent = "Solo racing and private rooms are available. Connect to the configured race server in the game.";
    document.querySelector("#privateRaceNote").textContent = "Host a private race, choose a course, and share the room code with friends connecting to the same server.";
  }
  direct.href = gameURL.href;

  function launchGame() {
    if (frame) return;
    ready = false;
    launch.disabled = true;
    launch.textContent = "Loading game…";
    status.textContent = "Downloading the game engine. The first launch is about 38 MB.";
    frame = document.createElement("iframe");
    frame.src = gameURL.href;
    frame.title = "Drone Rush — mouse-controlled drone racing";
    frame.allow = "autoplay; fullscreen; gamepad";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.addEventListener("error", () => {
      status.textContent = "The game could not load. Close it and try again, or open it in its own tab.";
    });
    mount.append(frame);
    mount.classList.add("is-loading");
    close.hidden = false;
  }
  launch.addEventListener("click", launchGame);
  close.addEventListener("click", () => {
    if (document.fullscreenElement === frame) document.exitFullscreen().catch(() => {});
    frame?.remove();
    frame = null;
    ready = false;
    mount.classList.remove("is-loading");
    start.hidden = false;
    close.hidden = true;
    fullscreen.disabled = true;
    launch.disabled = false;
    launch.textContent = "Launch game ▶";
    status.textContent = "Game closed. Launch again whenever you are ready.";
    launch.focus();
  });
  fullscreen.addEventListener("click", async () => {
    if (!frame || !ready) return;
    try {
      if (frame.requestFullscreen) await frame.requestFullscreen();
      else window.open(gameURL.href, "_blank", "noopener");
      frame.focus();
    } catch {
      status.textContent = "Fullscreen was unavailable. Use ‘Open game in its own tab’ instead.";
    }
  });
  addEventListener("message", (event) => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.type !== "drone-rush-load") return;
    if (data.state === "progress") {
      const value = Number.isFinite(data.percent) ? Math.min(100, Math.max(0, Math.round(data.percent))) : null;
      status.textContent = value === null ? "Loading game…" : `Loading game: ${value}%`;
    } else if (data.state === "ready") {
      ready = true;
      start.hidden = true;
      mount.classList.remove("is-loading");
      fullscreen.disabled = false;
      frame.focus();
    } else if (data.state === "error") {
      status.textContent = "The game reported a loading error. Check the message in the game window, or close it and retry.";
      start.hidden = true;
      mount.classList.remove("is-loading");
    }
  });

  function bootExport() {
    const canvas = document.querySelector("#canvas");
    const overlay = document.querySelector("#status");
    const progress = document.querySelector("#status-progress");
    const status = document.querySelector("#status-text");
    const notice = document.querySelector("#status-notice");
    const recovery = document.querySelector("#gameRecovery");
    let initializing = true;
    const notify = (state, percent) => {
      if (parent !== window) parent.postMessage({ type: "drone-rush-load", state, percent }, location.origin);
    };
    const fail = (error) => {
      if (!initializing) return;
      initializing = false;
      console.error("Drone Rush failed to start:", error);
      notice.textContent = error instanceof Error ? error.message : String(error || "An unexpected loading error occurred.");
      notice.hidden = false;
      status.textContent = "Unable to start the game.";
      progress.hidden = true;
      recovery.hidden = false;
      notify("error");
    };
    document.querySelector("#gameRetry").addEventListener("click", () => location.reload());
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      initializing = true;
      overlay.hidden = false;
      fail("The graphics context was lost. Close other graphics-heavy tabs and retry.");
    });
    if (typeof window.Engine !== "function") {
      fail("The game engine file could not load. Refresh the page or check your connection.");
      return;
    }
    const missing = Engine.getMissingFeatures({ threads: false });
    if (missing.length) {
      fail(`Your browser is missing: ${missing.join(", ")}. Try an updated browser with WebGL 2 and WebAssembly enabled.`);
      return;
    }
    const config = GODOT_EXPORT_CONFIG;
    config.canvas = canvas;
    config.ensureCrossOriginIsolationHeaders = false;
    const engine = new Engine(config);
    engine.startGame({
      onProgress(current, total) {
        if (!initializing) return;
        if (current > 0 && total > 0) {
          progress.max = total;
          progress.value = current;
          const value = Math.min(100, Math.round(current / total * 100));
          status.textContent = value >= 100 ? "Download complete. Preparing the course…" : `Downloading game: ${value}%`;
          notify("progress", value);
        } else {
          progress.removeAttribute("value");
          status.textContent = "Preparing game engine…";
          notify("progress");
        }
      },
    }).then(() => {
      if (!initializing) return;
      initializing = false;
      overlay.hidden = true;
      canvas.focus();
      notify("ready");
    }, fail);
  }
})();


if (document.body.classList.contains("terminal-page")) {
/* Terminal commands are loaded only on terminal.html. */
(() => {
"use strict";

const sections = [
  ["home", "Home"],
  ["reel", "Flight reel"],
  ["rates", "Rates"],
  ["projects", "About"],
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
const output = document.querySelector("#terminalOutput");
const form = document.querySelector("#terminalForm");
const input = document.querySelector("#terminalInput");
const runButton = document.querySelector("#terminalRun");
const statusLabel = document.querySelector("#terminalStatus");
const terminalConsole = document.querySelector("#terminalConsole");
const terminalToggle = document.querySelector("#terminalToggle");
const quickButtons = [...document.querySelectorAll("[data-command]")];
const scanlines = document.querySelector("#scanlines");
let active = "home",
  busy = true,
  matrixOn = true,
  trailOn = true;
let commandHistory = [],
  historyPosition = 0;
let terminalEngaged = false;

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const terminalFAQs = Array.isArray(window.terminalFAQs)
  ? window.terminalFAQs
  : [];

function add(text, tone = "") {
  const line = document.createElement("p");
  line.textContent = text;
  if (tone) line.className = tone;
  output.append(line);
  while (output.childElementCount > 250) output.firstElementChild.remove();
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

let bootTimers = [];
function boot() {
  bootTimers.forEach(clearTimeout);
  bootTimers = [];
  output.replaceChildren();
  setBusy(true);
  const sequence = [
    ["initialize --portfolio --terminal", "cmd"],
    ["[SUCCESS] flight archive mounted", "ok"],
    ["[SUCCESS] project modules indexed", "ok"],
    ["[SUCCESS] question database mounted", "ok"],
    ["[SUCCESS] portfolio links ready", "ok"],
    ["[INFO] ask: availability / equipment / 360 / play reel", "dim"],
    ["[READY] shell active — type “help”", "pink"],
  ];
  sequence.forEach(([text, tone], index) =>
    bootTimers.push(setTimeout(
      () => {
        add(text, tone);
        if (index === sequence.length - 1) {
          setBusy(false);

        }
      },
      reducedMotion ? 0 : 80 + index * 110,
    )),
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
    skills: "projects",
    work: "projects",
    rates: "rates",
    pricing: "rates",
    quote: "rates",
    contact: "contact",
  };
  const route = routes[target];
  if (!route) return add(`Unknown destination: ${target}`, "err");
  window.location.href = `index.html#${route}`;
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
  window.location.href = "index.html#reel";
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
      { signal: AbortSignal.timeout(10000) },
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
    window.PortfolioEffects?.set("matrix", matrixOn);
    add(`Matrix rain ${args[0]}.`, "pink");
  } else if (name === "trail" && ["on", "off"].includes(args[0])) {
    trailOn = args[0] === "on";
    window.PortfolioEffects?.set("trail", trailOn);
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
  if (commandHistory.length > 100) commandHistory.shift();
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
  const willOpen = terminalConsole.classList.contains("is-collapsed");
  setTerminalCollapsed(!willOpen, willOpen);
});
terminalConsole?.addEventListener("click", () => {
  if (!terminalConsole.classList.contains("is-collapsed")) return;
  terminalEngaged = true;
  setTerminalCollapsed(false, true);
});
terminalConsole?.addEventListener("pointerdown", () => {
  if (terminalConsole.classList.contains("is-collapsed")) return;
  terminalEngaged = true;
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
    const match = completions.find((item) =>
      item.startsWith(input.value.toLowerCase()),
    );
    if (match && !event.shiftKey && input.value.trim() && match !== input.value) {
      event.preventDefault();
      input.value = match;
    }
  } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    output.replaceChildren();
  } else if (event.key === "Escape") {
    input.blur();
    // Escape leaves the command field without hiding the page.
  }
});


boot();
})();

}

/* Structured data for existing service pages. */
(() => {
const byPage = {"360.html": [{"@context": "https://schema.org", "@type": "CollectionPage", "@id": "https://www.heathfpv.com/360.html#page", "url": "https://www.heathfpv.com/360.html", "name": "Interactive 360 Drone Tour Demo", "description": "A three-scene interactive 360 drone tour demonstration by Heath Lyon FPV.", "isPartOf": {"@type": "WebSite", "@id": "https://www.heathfpv.com/#website", "url": "https://www.heathfpv.com/", "name": "Heath Lyon FPV"}, "about": {"@id": "https://www.heathfpv.com/utah-county-drone-tours.html#service"}}], "utah-county-drone-tours.html": [{"@context": "https://schema.org", "@graph": [{"@type": "ProfessionalService", "@id": "https://www.heathfpv.com/#business", "name": "Heath Lyon FPV", "url": "https://heathfpv.com/", "image": "https://www.heathfpv.com/images/utah-county-fpv-drone-tour.webp", "email": "mailto:Lyon.m.heath@gmail.com", "description": "FAA Part 107 drone pilot providing FPV video, aerial media, and 360 drone tours in Utah County, Utah.", "address": {"@type": "PostalAddress", "addressLocality": "Provo", "addressRegion": "UT", "addressCountry": "US"}, "areaServed": [{"@type": "AdministrativeArea", "name": "Utah County, Utah"}, {"@type": "City", "name": "Provo, Utah"}, {"@type": "City", "name": "Orem, Utah"}, {"@type": "City", "name": "Lehi, Utah"}], "sameAs": ["https://www.youtube.com/@SkyLensProvo", "https://instagram.com/skylensprovo", "https://github.com/HeathLyon"]}, {"@type": "Service", "@id": "https://heathfpv.com/utah-county-drone-tours.html#service", "name": "360 Drone Tours and Virtual Tours in Utah County", "serviceType": ["360 drone tours", "aerial virtual tours", "drone video tours"], "provider": {"@id": "https://www.heathfpv.com/#business"}, "areaServed": {"@type": "AdministrativeArea", "name": "Utah County, Utah"}, "offers": {"@type": "Offer", "price": "350", "priceCurrency": "USD", "description": "Starting estimate for basic 360 capture or a starter clickable-tour media package. Final pricing depends on location, access, flight conditions, editing, and deliverables.", "url": "https://www.heathfpv.com/contact-form.html"}}, {"@type": "FAQPage", "@id": "https://www.heathfpv.com/utah-county-drone-tours.html#faq", "mainEntity": [{"@type": "Question", "name": "What is a 360 drone tour?", "acceptedAnswer": {"@type": "Answer", "text": "A 360 drone tour lets viewers look in every direction from aerial viewpoints. It can be delivered as a guided 360 video or as a clickable virtual tour with connected scenes and hotspots."}}, {"@type": "Question", "name": "Where are 360 drone tours available?", "acceptedAnswer": {"@type": "Answer", "text": "Heath Lyon is based in Provo and serves Utah County, including Provo, Orem, Lehi, American Fork, Pleasant Grove, Vineyard, Springville, Spanish Fork, Saratoga Springs, and Eagle Mountain. Travel outside the county is available by quote."}}, {"@type": "Question", "name": "How much does a 360 drone tour cost?", "acceptedAnswer": {"@type": "Answer", "text": "Basic 360 capture or a starter clickable-tour media package begins at $350. Location, airspace, access, number of scenes, editing, travel, and hosting requirements affect the final quote."}}, {"@type": "Question", "name": "Can a 360 tour be shared with clients?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. The finished experience can be delivered as a shareable link suitable for a website, listing, presentation, email, or client review."}}]}, {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.heathfpv.com/"}, {"@type": "ListItem", "position": 2, "name": "Utah County Drone Tours", "item": "https://heathfpv.com/utah-county-drone-tours.html"}]}]}]};
const page = decodeURIComponent(location.pathname.split("/").pop());
for (const data of byPage[page] || []) { const node=document.createElement("script"); node.type="application/ld+json"; node.textContent=JSON.stringify(data); document.head.append(node); }
})();
