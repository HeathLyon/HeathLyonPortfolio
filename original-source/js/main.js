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
/* Every public content page is listed here. Keep this index in the shared main.js. */
window.portfolioSearchIndex = [
  {
    "title": "Home — Heath Lyon FPV",
    "url": "index.html",
    "description": "Cinematic FPV video, aerial photography, filming rates, and the story behind Heath FPV.",
    "keywords": [
      "home",
      "homepage",
      "portfolio",
      "Heath Lyon",
      "selfi",
      "about",
      "pilot",
      "Part 107"
    ],
    "kind": "page",
    "content": "FAA PART 107 // FPV CINEMATIC OPERATOR FPV drone video & 360 tours in Utah. I'm Heath Lyon, an FAA Part 107 pilot based in Provo. I create cinematic FPV video, aerial photography, and interactive 360 tours for properties, brands, and productions. Watch the reel Request a quote BASED IN Provo, Utah CERTIFIED FAA Part 107 AVAILABLE FOR Local & travel SYS 01_FLIGHT_MEDIA_ARCHIVE FPV drone video reel Aerial footage, tracking shots, and production work filmed with aircraft I build, maintain, and fly. REC ● HL-FPV_2026 4K SOURCE FLIGHT_MANIFEST 01 Cinematic FPV Proximity, tracking, landscape, and dynamic movement. 02 Production Safety briefings, field support, and client-facing shoots. 03 Build testing Payload trials, tuning, vibration diagnosis, and repair. SYS 02_SERVICE_RATE_INDEX Drone filming rates Reserve your shoot with $100 upfront. Standard packages include a guaranteed two-day turnaround; rush delivery is available below. 01 · FULL DAY Full Day $600 starting 10 hours of coverage, including finished aerial photos or edited video. 02 · HALF DAY Half Day $400 starting 5 hours of coverage, including finished aerial photos or edited video. 03 · RUSH DELIVERY Same-Day Rush $800 starting Full-day coverage with same-day delivery of your finished video. CUSTOM_MISSION Request a project quote. Send the location, date, deliverables, and intended use. Request a quote Utah County 360 tours SYS 04_ABOUT_HEATH About Heath Lyon I'm a Provo-based drone pilot and developer with hands-on experience in aerial production, custom aircraft, and software. Here is a look at the person and projects behind Heath FPV. PILOT // BUILDER // DEVELOPER Creative production. Practical engineering. I build and fly custom FPV aircraft for cinematic production. My work also spans search and rescue research, computer vision, and interactive media. Work with Heath Selected projects GODOT PLAY IN BROWSER A01 · INTERACTIVE GAME Drone Rush Race a drone through three 3D courses using your mouse. Launch a solo time trial, then explore private races with a connected race server. LAUNCH GAME ↗ RF A02 · RESEARCH Search & Rescue Payloads Research into RF sensing, phone detection, and modular drone payloads for search and rescue. View project ↗ CV A03 · COMPUTER VISION YOLO Fall Detection A computer vision prototype combining pose tracking, fall detection, privacy controls, and alerts. View project ↗ 3D A04 · SPATIAL ARCHIVE Archaeology 3D Scans Interactive 3D viewers for exploring excavation sites, scanned artifacts, and field records. View project ↗ 360 A05 · IMMERSIVE MEDIA Interactive 360 Tours Connected aerial panoramas that let viewers explore a property or location in every direction. View project ↗ SYS 05_CONTACT Book your drone shoot Tell me what you need, where you’re filming, and your timeline. Available for aerial production and technical projects in Utah and on location. Discuss your project YouTube reel EMAIL Lyon.m.heath@gmail.com GITHUB github.com/HeathLyon INSTAGRAM @skylensprovo LOCATION Provo, Utah // Travel ready CHANNEL OPEN // NEW PROJECTS"
  },
  {
    "title": "Drone Rush — browser game",
    "url": "drone-rush.html",
    "description": "Race three drone courses. Solo time trials and private rooms with a connected race server.",
    "keywords": [
      "game",
      "Godot",
      "gdot",
      "racing",
      "play",
      "multiplayer"
    ],
    "kind": "page",
    "content": "HEATH FPV // BROWSER ARCADE DRONE // RUSH Three tracks. One mouse. Find your racing line. A 3D drone racer built in Godot. Choose a course, launch a solo time trial, and fly through the gates. 3 COURSES MOUSE CONTROLS SOLO TIME TRIALS DRONE RUSH // WEB BUILD Fullscreen ↗ Close game READY ON THE START LINE Take the controls. The first launch downloads about 38 MB. Best played on a desktop or laptop with a mouse. Launch game ▶ The game loads only when you launch it. The multiplayer server address is filled in automatically. Host or join a private race in the game. Open game in its own tab ↗ The game requires JavaScript and WebGL 2. Enable JavaScript, then reload this page. FLIGHT CONTROLS Fly with your mouse. Move mouse Steer and climb Hold left click Boost Hold right click Brake Leave Race Return to the in-game menu Use fullscreen for the clearest view. Close the game above to stop it and return to the page. CHOOSE YOUR COURSE Three ways to race. Neon Circuit Fast city turns Canyon Run Rock pillars and sweeping bends Sky Spiral A high-altitude climbing course PRIVATE RACES Bring your crew. Private rooms support up to six pilots on the same race server. The host chooses the course and shares a six-character room code. Host a private race, choose a course, and share the room code with your friend. Open this same game page to join with that code."
  },
  {
    "title": "Interactive portfolio terminal",
    "url": "terminal.html",
    "description": "Ask about equipment, availability, services, and projects in the command console.",
    "keywords": [
      "console",
      "commands",
      "faq",
      "questions",
      "help"
    ],
    "kind": "page",
    "content": "PORTFOLIO // INTERACTIVE CONSOLE Explore the terminal. Type a command or a question about my work. Start with help , equipment , or rates . portfolio://flight_console ◌ BOOTING MINIMIZE Terminal command root@heath:~$ RUN help availability equipment 360 reel rates contact The interactive terminal needs JavaScript. View rates or contact Heath . ← Back to the portfolio"
  },
  {
    "title": "360 drone tours in Utah County",
    "url": "utah-county-drone-tours.html",
    "description": "Immersive aerial tours for real estate, venues, and locations. Explore the service and booking process.",
    "keywords": [
      "virtual",
      "property",
      "services",
      "panorama",
      "Provo"
    ],
    "kind": "page",
    "content": "PROVO_BASE // UTAH_COUNTY_SERVICE_AREA 360 drone tours in Utah County. Give clients a view they can control. Heath Lyon creates aerial 360 experiences, clickable virtual tours, and cinematic drone video for properties, venues, destinations, and project sites. Request a tour View 360 examples FAA PART 107 PILOT PROVO, UTAH SHAREABLE DELIVERY TOUR_SERVICE_01 BOOKING OPEN 360° Starter tour from $350 Basic 360 capture or a starter clickable-tour media package. Final pricing depends on the site, flight plan, scene count, editing, travel, and delivery needs. BASE PROVO, UT AREA UTAH COUNTY QUOTE PROJECT-SPECIFIC SERVICE_FORMATS // CHOOSE THE VIEW One location. Three ways to explore. The right format depends on whether the viewer should follow a story, explore freely, or see both ground-level and aerial views. 01 · GUIDED 360 drone video A guided aerial flight where viewers drag, swipe, or move their phone to look around while the scene moves. 02 · INTERACTIVE Clickable aerial tour Connected 360 viewpoints and hotspots that let a client choose where to look and which scene to open next. 03 · CINEMATIC Drone video tour A concise edited video that establishes the property, reveals the surroundings, and guides viewers through the key story. USE_CASES // BUILT TO SHARE Show more than a listing photo can. Aerial context helps viewers understand scale, access, views, surrounding features, and the relationship between spaces. FIELD_CAPTURE // UTAH VIEWPOINT READY 01 Real estate & development Show lots, land, luxury homes, access, views, and nearby context. 02 Venues & hospitality Let planners and guests explore a venue before they arrive. 03 Tourism & outdoor spaces Present trails, destinations, campuses, and recreation areas in context. 04 Construction & project sites Create a clear, shareable visual record for teams and stakeholders. MISSION_FLOW // FOUR STEPS A direct route from site to shareable tour. Every project begins with the location and intended use so the flight, capture plan, and delivery format match the goal. 01 Send the brief Location, preferred date, audience, and must-see areas. 02 Plan the mission Access, airspace, weather, safety, viewpoints, and deliverables. 03 Capture the site FAA Part 107 flight operations and the selected 360 or video format. 04 Receive and share Review the finished media and share the delivered link with your audience. SERVICE_AREA // LOCAL FLIGHT OPS Based in Provo. Serving Utah County. Local coverage includes communities across Utah County. Projects outside the county are available when travel fits the mission. Provo Orem Lehi American Fork Pleasant Grove Vineyard Springville Spanish Fork Saratoga Springs Eagle Mountain FAQ_INDEX // CLIENT QUESTIONS Utah County drone tour FAQ. Short answers before you request a project-specific quote. What is a 360 drone tour? It is an aerial experience where viewers can look in every direction. It may be a guided 360 video or a clickable virtual tour with connected scenes and hotspots. Where are 360 drone tours available? Heath is based in Provo and serves Utah County, including Provo, Orem, Lehi, American Fork, Pleasant Grove, Vineyard, Springville, Spanish Fork, Saratoga Springs, and Eagle Mountain. Travel outside the county is available by quote. How much does a 360 drone tour cost? Basic 360 capture or a starter clickable-tour package begins at $350. Airspace, access, scene count, travel, editing, hosting, and final deliverables affect the quote. Can the finished tour be shared with clients? Yes. The finished experience can be delivered as a shareable link for a website, listing, presentation, email, or client review. Can every property be flown? Not automatically. Weather, airspace, people, access, site conditions, and the requested flight path are reviewed before the project is confirmed. A safer alternative can be proposed when a specific flight is not practical. CHANNEL_OPEN // DIRECT_QUOTE Put your Utah County location in motion. Send the address or general location, target date, and what the viewer should understand after taking the tour. Request a tour See 360 work Watch FPV reel"
  },
  {
    "title": "Interactive 360 tour demo",
    "url": "360.html",
    "description": "Explore connected panoramic scenes and watch 360 flight media.",
    "keywords": [
      "virtual",
      "immersive",
      "panorama",
      "live demo",
      "video"
    ],
    "kind": "page",
    "content": "SKYLENS_360 // THREE-SCENE DEMO Step inside the view. Explore three connected 360° scenes. Drag on a computer, swipe on a phone, or enable motion to look around naturally. Launch 360° demo Request your tour HOW_TO_EXPLORE 01 DRAG to look in any direction. 02 CLICK a hotspot to change scenes. 03 ENABLE MOTION on a compatible phone. LIVE_VIEW // INTERACTIVE TOUR Three connected scenes. Drag or swipe the image to look around. LIVE 360° SCENE 01 // OVERVIEW HEATH FPV LOADING 360° SCENE 360img1.webp 360 IMAGE NOT FOUND The panorama could not be loaded. Check the file path and image size. images/logo/360/360img1.webp TRY AGAIN ← PREVIOUS NEXT VIEW → + − RESET ENABLE MOTION FULLSCREEN 01 OVERVIEW 360img1.webp 02 VIEWPOINT 360img2.webp 03 FINAL VIEW 360img3.webp JavaScript is required for the interactive 360° viewer. MORE_360 // FLIGHT + CLIENT TOURS See it in motion. Watch a moving 360° flight or request a tour for your location. 360_VIDEO // FLIGHT 01 YOUTUBE // LIVE FLIGHT_ARCHIVE // 01 Interactive 360° flight Press play, then drag or move your phone to explore the flight. 360_VIDEO // FLIGHT 02 YOUTUBE // LIVE FLIGHT_ARCHIVE // 02 Immersive 360° perspective Choose the view yourself while the camera moves through the scene. YOUR_LOCATION // CUSTOM TOUR Put visitors inside your space. Ideal for venues, properties, attractions, trails, and project sites. Request a tour View services SHAREABLE // EMBEDDABLE One link. Any website. Each finished tour can have a direct client link and can be embedded into another website without sending visitors somewhere else. Build my 360° tour"
  },
  {
    "title": "YOLO fall detection",
    "url": "Yollo.html",
    "description": "A computer vision prototype with pose tracking, privacy rendering, and fall alerts.",
    "keywords": [
      "Yollo",
      "AI",
      "OpenCV",
      "Python",
      "tracking",
      "computer vision"
    ],
    "kind": "page",
    "content": "CV_01 // DESKTOP PYTHON PROTOTYPE YOLO fall detection. A pose-estimation prototype that follows body geometry over time, evaluates fall-like movement, renders a privacy-aware skeleton, and records or forwards an incident. The recorded demo shows the desktop Python system without requesting a visitor's camera. PYTHON YOLO11 POSE OPENCV TEMPORAL RULES LOCAL-FIRST ▶ Watch demonstration Open downloads PROJECT_CV01 CASE STUDY 17 Pose keypoints per subject The model supplies joints and confidence values. Separate logic examines posture, vertical movement, detection quality, and time spent down instead of judging a single frame. RUNTIME DESKTOP PYTHON WEB MODE RECORDED DEMO CAMERA ACCESS NOT REQUESTED STATUS RESEARCH PROTOTYPE DEMO_01 // RECORDED SYSTEM RUN See the detector in motion. This recording replaces the former technical slideshow. It shows the real desktop workflow while keeping the public portfolio page lightweight and browser-safe. portfolio://cv01_recorded_demo LOCAL PYTHON // VIDEO PLAYBACK Your browser does not support HTML video playback. DEMO FILE OFFLINE Add Yolloproject.mp4 to the video folder. The player will connect automatically. WHAT TO WATCH Pose keypoints, state changes, confidence, incident logging, and the optional alert path. PRIVACY The webpage plays a recording; it does not activate the viewer's webcam or execute the Python model. PROCESS_01 // FIVE CLEAR STEPS From camera frame to alert. The code is organized as a sequence of small responsibilities. Each stage can be tested, tuned, or replaced without rewriting the entire application. 01 CAPTURE Read one camera frame. camera.py opens the selected camera, checks that each frame is valid, and releases the hardware cleanly when the program closes. 02 DETECT Locate the person and joints. pose.py runs YOLO pose inference and returns body keypoints with confidence values. Unreliable detections are rejected before they reach the fall logic. 03 COMPARE Measure change over time. fall_detector.py compares body angle, hip height, vertical movement, and recent posture history. A single horizontal frame is not enough to declare a fall. 04 CONFIRM Hold the state long enough to matter. Configurable thresholds confirm that fall-like evidence lasts long enough, then use recovery and cooldown states to reduce duplicate or one-frame alerts. 05 RESPOND Render, log, and optionally notify. renderer.py draws the privacy-aware display, alert_logger.py records the event, and an optional adapter can send a notification with secrets kept outside the public code. DOWNLOAD STATUS The architecture and research brief is available now. A public Python package should be released only after credentials are removed, dependencies are pinned, and the prototype is tested in a clean environment. Download brief IMPACT_01 // UNITED STATES, AGE 65+ Why fall awareness matters. Falls are the leading cause of injury for adults 65 and older. The figures below are from current CDC fall data and prevention resources, reviewed August 2, 2026. 1 in 4 older adults report a fall each year More than 14 million U.S. adults age 65+ report falling annually. CDC Older Adult Falls Data ↗ 9M fall injuries are estimated each year About 37% of older adults who fall report an injury that needs medical treatment or restricts activity for at least a day. CDC Older Adult Falls Data ↗ 3M / 1M emergency visits / hospitalizations Falls lead to roughly 3 million emergency-department visits and about 1 million hospitalizations among older adults each year. CDC Facts About Falls ↗ +21% increase in the fall death rate The age-adjusted rate increased from 64.7 deaths per 100,000 in 2018 to 78.4 in 2024. CDC Older Adult Falls Data ↗ THE DANGERS A fall can change health and independence. Older-adult falls can cause traumatic brain injury, hip fracture, hospitalization, loss of mobility, and death. CDC identifies falls as the most common cause of traumatic brain injury and estimates roughly 300,000 hip-fracture hospitalizations related to falls each year. Even without a major injury, fear of another fall can lead a person to move less. Reduced activity can weaken strength and balance, which may increase future risk. PRIMARY SOURCES CDC — Older Adult Falls Data CDC — Facts About Falls CDC — Preventing Falls and Hip Fractures CDC STEADI — Clinical Fall Prevention Download full report PROTOTYPE LIMITS This project is a research and portfolio demonstration, not a medical device, diagnostic tool, or emergency-response service. Computer vision can miss events or produce false alerts. It should not replace professional care, a validated monitoring system, or calling emergency services when immediate help is needed."
  },
  {
    "title": "Search & rescue payload research",
    "url": "sar-project.html",
    "description": "RF sensing, phone detection, and modular drone payload concepts.",
    "keywords": [
      "SAR",
      "rescue",
      "sensor",
      "phone",
      "RF",
      "research"
    ],
    "kind": "page",
    "content": "RF_02 // SEARCH + RESCUE RESEARCH Find the signal. A modular aerial payload concept for directional RF sensing, phone-presence research, search-pattern telemetry, and spatial overlays. The design separates flight safety from experimental sensing hardware. ESP32 RASPBERRY PI PYTHON RF SENSING GIS OVERLAY Inspect system Project library ARCH_02 // MODULAR FIELD STACK Separate the aircraft from the experiment. The payload should collect repeatable data without turning experimental code into a flight-critical dependency. 01 // CAPTURE RF sensor head Directional antenna and embedded capture module produce timestamped signal observations. 02 // POSITION Flight telemetry Position, heading, altitude, and sweep state make each observation spatially meaningful. 03 // TRANSPORT Modular link A contained payload link prevents a sensor failure from interfering with the aircraft control system. 04 // VISUALIZE Radar playback Recorded observations become a browser radar, heatmap, timeline, and confidence trail. 05 // TEST Known targets Bench and field trials use controlled distances, orientations, and signal sources before operational claims. 06 // ETHICS Privacy boundary Research should minimize retained identifiers, document consent, and follow applicable radio and privacy rules."
  },
  {
    "title": "Archaeology 3D scans",
    "url": "archaeology-project.html",
    "description": "Interactive viewer plans for scanned sites, artifacts, and field records.",
    "keywords": [
      "GLB",
      "GLTF",
      "Three.js",
      "archive",
      "3d",
      "archaeology"
    ],
    "kind": "page",
    "content": "3D_04 // SPATIAL FIELD ARCHIVE Preserve the site. A static-hosted Three.js archive for GLB/GLTF scans, selectable sites, excavation metadata, free camera controls, measurements, and guided annotations. THREE.JS GLB / GLTF WEBGL METADATA STATIC HOSTING Inspect viewer plan Project library VIEWER_01 // BROWSER_NATIVE Make every scan explainable. The viewer should connect geometry to the site record, not present an isolated object with no field context. 01 // SELECT Site index Choose a trench, feature, artifact, or survey from a searchable project inventory. 02 // LOAD Progressive model Load optimized GLB assets with visible progress, scale checks, and a useful default camera. 03 // INSPECT Free camera Orbit, pan, zoom, reset, and switch to documented viewpoints without losing orientation. 04 // RECORD Metadata panel Show provenience, date, team, method, scale, notes, and linked field documentation. 05 // ANNOTATE Spatial markers Attach labels, interpretive notes, measurements, and confidence to positions on the scan. 06 // SHARE Guided tour Save a sequence of viewpoints and captions as a browser presentation for classes or reports."
  },
  {
    "title": "Project downloads",
    "url": "downloads.html",
    "description": "Source packages, demonstrations, project briefs, and the browser build queue.",
    "keywords": [
      "code",
      "software",
      "files",
      "download",
      "source",
      "library"
    ],
    "kind": "page",
    "content": "SYS_05 // PUBLIC_PROJECT_LIBRARY Download the work. Source packages, editable files, technical briefs, and working demonstrations. Every active download is a real file; items marked “source pending” stay locked until they can be safely verified. LIBRARY_01 // FILTERABLE_INDEX Projects and files. Filter by source type. Browser projects open directly from static hosting; desktop Python projects use a download and local setup. All Browser Python Source Briefs GODOT // DRONE RUSH Drone Rush Play three drone racing tracks in your browser with mouse controls and solo time trials. Play in browser DL_01 // HTML + CSS + JS Retro portfolio source Editable HTML, CSS, and JavaScript for the portfolio, project pages, terminal, and game launcher. This source ZIP excludes large media and the Godot engine binaries. READY // ZIP Download source Open site DL_02 // COMPUTER VISION YOLO fall detector Desktop pose-estimation prototype with temporal fall logic, privacy rendering, local logging, and an optional alert adapter. SOURCE PENDING // BRIEF READY View demo Download brief Python ZIP locked DL_03 // BUILD QUEUE Browser project ideas Six presentation-ready builds ranked for an FPV pilot, systems builder, computer-vision developer, and spatial-data portfolio. READY // TXT Download ideas Preview queue DL_04 // FPV MEDIA Flight reel The existing cinematic reel remains embedded in the index with poster art, native playback controls, and the original video file. LIVE // BROWSER Watch reel DL_05 // RF RESEARCH SAR payload system Modular RF sensing concept joining embedded capture, Python telemetry, directional search patterns, and field mapping. CASE STUDY // PROTOTYPE Open case study DL_06 // THREE.JS Archaeology 3D archive Browser-native GLB/GLTF viewer concept with site selection, metadata, free camera controls, annotations, and field records. CASE STUDY // NEXT BUILD Open case study QUEUE_01 // BROWSER_NATIVE_BUILDS What to program next. Each idea can run from static hosting with HTML, CSS, and JavaScript. Start with uploaded or sample data, then add live APIs only where they improve the presentation. 01 BEST NEXT PROJECT FPV Blackbox Analyzer Upload a flight log, synchronize gyro, motor, voltage, and event charts, then produce an evidence-based diagnostic summary. 02 FIELD TOOL FPV Shot Planner Draw a route, estimate battery use, build a shot list, and export a compact production brief for the crew. 03 SENSING RF / CSI Playback Radar Replay recorded ESP32 or Pi data as a radar, heatmap, timeline, and anomaly log without needing live hardware. 04 COMPUTER VISION Browser Pose Arcade Use local webcam pose estimation for gesture targets, reaction timing, or a two-player mirror challenge with privacy mode. 05 ENGINEERING Drone Power Calculator Model motor KV, prop, battery, payload, hover current, thrust-to-weight, and save a build as shareable JSON. 06 SPATIAL DATA 3D Field Archive Load GLB scans, inspect site metadata, place annotations, measure distances, and save a guided tour in the browser."
  },
  {
    "title": "Contact & booking",
    "url": "contact-form.html",
    "description": "Share your location, shoot date, and deliverables to request a quote.",
    "keywords": [
      "email",
      "hire",
      "availability",
      "book",
      "quote",
      "message",
      "transmission"
    ],
    "kind": "page",
    "content": "SECURE_CONTACT_LINK // FORMSPREE Send a transmission. Tell me what you want to capture, build, or solve. Include the location and target date when they are known. STATUS ACCEPTING PROJECT REQUESTS BASE PROVO, UTAH // TRAVEL READY CHANNEL DIRECT EMAIL RESPONSE MESSAGE_COMPOSER ● LINK READY NAME REQUIRED EMAIL REQUIRED SUBJECT REQUIRED QUESTION TO ANSWER OPTIONAL Select a topic... Pricing Availability Previous work Equipment 360 video or tour Other MESSAGE REQUIRED All required fields must be completed before transmission. Send transmission →"
  },
  {
    "title": "Drone filming rates",
    "url": "index.html#rates",
    "description": "Full day from $600, half day from $400, and same-day rush from $800. Reserve with $100 upfront.",
    "keywords": [
      "pricing",
      "prices",
      "cost",
      "booking",
      "day rate",
      "two day turnaround"
    ],
    "kind": "section"
  },
  {
    "title": "FPV drone video reel",
    "url": "index.html#reel",
    "description": "Watch cinematic FPV footage, tracking shots, and production work.",
    "keywords": [
      "film",
      "aerial",
      "cinematography",
      "cinelifter",
      "reel"
    ],
    "kind": "section"
  },
  {
    "title": "About Heath Lyon",
    "url": "index.html#projects",
    "description": "Meet the Provo-based FAA Part 107 pilot, builder, and developer, and explore his projects.",
    "keywords": [
      "bio",
      "selfie",
      "selfi",
      "certification",
      "who",
      "location",
      "about me"
    ],
    "kind": "section"
  },
  {
    "title": "Full-day drone shoot — $600 starting",
    "url": "index.html#rates",
    "description": "10 hours of coverage with finished aerial photos or edited video.",
    "keywords": [
      "day rate",
      "pricing",
      "cost",
      "600",
      "full day"
    ],
    "kind": "section"
  },
  {
    "title": "Half-day drone shoot — $400 starting",
    "url": "index.html#rates",
    "description": "5 hours of coverage with finished aerial photos or edited video.",
    "keywords": [
      "day rate",
      "pricing",
      "cost",
      "400",
      "half day"
    ],
    "kind": "section"
  },
  {
    "title": "Same-day rush — $800 starting",
    "url": "index.html#rates",
    "description": "Full-day coverage with same-day delivery of your finished video.",
    "keywords": [
      "urgent",
      "fast",
      "rush delivery",
      "pricing",
      "800"
    ],
    "kind": "section"
  }
];

/* js/search.js */
/* Local search across all public pages and key homepage sections. */
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
    summaryText: normalize([entry.title, entry.description, ...(entry.keywords || [])].join(" ")),
    text: normalize([entry.title, entry.description, ...(entry.keywords || []), entry.content || ""].join(" ")),
  }));
  let opener;
  function render() {
    const query = normalize(field.value);
    const tokens = query.split(" ").filter(Boolean);
    const matches = !query ? indexed.filter((entry) => entry.kind === "page") : indexed
      .filter((entry) => tokens.every((token) => entry.text.includes(token)))
      .map((entry) => ({ ...entry, score: (entry.titleText.includes(query) ? 20 : 0) + tokens.filter((token) => entry.titleText.includes(token)).length * 5 + tokens.filter((token) => entry.summaryText.includes(token)).length }))
      .sort((a, b) => b.score - a.score);
    list.replaceChildren();
    matches.forEach((entry) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      // Destinations come from this local index; search input is rendered as text.
      link.href = entry.url;
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const description = document.createElement("span");
      description.textContent = entry.description;
      link.append(title, description);
      item.append(link);
      list.append(item);
    });
    status.textContent = !query ? `All ${matches.length} pages — type to search pages and sections` : matches.length
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
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = [...list.querySelectorAll("a")];
    const current = links.indexOf(document.activeElement);
    if (!links.length || (document.activeElement !== field && current < 0)) return;
    event.preventDefault();
    if (current < 0) links[event.key === "ArrowDown" ? 0 : links.length - 1].focus();
    else {
      const next = current + (event.key === "ArrowDown" ? 1 : -1);
      if (next < 0 || next >= links.length) field.focus();
      else links[next].focus();
    }
  });
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
  // Public race relay; passed to the Godot export in its relay query parameter.
  const DRONE_RUSH_RELAY_URL = "wss://drone-rush-relay.onrender.com/ws";

  if (document.body.classList.contains("godot-game")) {
    const directURL = new URL(location.href);
    if (!directURL.searchParams.get("relay")) {
      directURL.searchParams.set("relay", DRONE_RUSH_RELAY_URL);
      history.replaceState(history.state, "", directURL.href);
    }
    if (directURL.searchParams.get("relay") === DRONE_RUSH_RELAY_URL) {
      const healthURL = new URL("/health", DRONE_RUSH_RELAY_URL);
      healthURL.protocol = "https:";
      // Start the relay while the engine loads. Solo play can start independently.
      fetch(healthURL, {
        mode: "no-cors",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
      }).catch(() => {});
    }
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
    document.querySelector("#relayStatus").textContent = "The multiplayer server address is filled in automatically. Host or join a private race in the game.";
    document.querySelector("#privateRaceNote").textContent = "Host a private race, choose a course, and share the room code with your friend. Open this same game page to join with that code.";
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
