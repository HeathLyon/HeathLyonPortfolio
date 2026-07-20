const header = document.getElementById("siteHeader");
const footer = document.getElementById("siteFooter");

if (header) {
    header.innerHTML = `
        <header class="site-header">
            <nav class="navbar" aria-label="Primary navigation">
                <a class="logo" href="index.html" aria-label="Heath Lyon home">
                    <img
                        src="images/logo/FrontFPV.webp"
                        class="site-logo-mark"
                        alt="Heath Lyon FPV"
                        width="420"
                        height="226"
                        decoding="async"
                    >
                </a>

                <button
                    class="menu-button"
                    id="menuButton"
                    type="button"
                    aria-label="Open menu"
                    aria-controls="navLinks"
                    aria-expanded="false"
                >
                    ☰
                </button>

                <ul class="nav-links" id="navLinks">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="drone-reel.html">Drone Reel</a></li>
                    <li><a href="projects.html">Projects</a></li>
                    <li><a href="work-history.html">Work History</a></li>
                    <li><a href="skills.html">Skills</a></li>
                    <li><a href="contact.html">Contact</a></li>
                </ul>
            </nav>
        </header>
    `;
}

if (footer) {
    footer.innerHTML = `
        <footer class="site-footer">
            <p>&copy; <span id="currentYear"></span> Heath Lyon // SYSTEMS PORTFOLIO</p>
            <p class="last-updated">Last build: <span id="lastUpdated"></span></p>
        </footer>
    `;
}

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

function closeMenu() {
    if (!menuButton || !navLinks) return;

    navLinks.classList.remove("show");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
}

if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("show");

        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    navLinks.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            closeMenu();
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".navbar")) {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 920) {
            closeMenu();
        }
    });
}

const currentYear = document.getElementById("currentYear");
if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const lastUpdated = document.getElementById("lastUpdated");
if (lastUpdated) {
    const modifiedDate = new Date(document.lastModified);

    lastUpdated.textContent = modifiedDate.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
    }
});

function initializeCursorField() {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.35;
    let currentX = targetX;
    let currentY = targetY;

    root.style.setProperty("--cursor-x", `${currentX}px`);
    root.style.setProperty("--cursor-y", `${currentY}px`);

    if (reducedMotion) return;

    function updateTarget(x, y) {
        targetX = x;
        targetY = y;
    }

    window.addEventListener("pointermove", (event) => {
        updateTarget(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        if (!touch) return;

        updateTarget(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
        updateTarget(window.innerWidth * 0.5, window.innerHeight * 0.35);
    });

    function animate() {
        currentX += (targetX - currentX) * 0.075;
        currentY += (targetY - currentY) * 0.075;

        root.style.setProperty("--cursor-x", `${currentX.toFixed(1)}px`);
        root.style.setProperty("--cursor-y", `${currentY.toFixed(1)}px`);

        window.requestAnimationFrame(animate);
    }

    window.requestAnimationFrame(animate);
}


function initializeCursorTrail() {
    const canvas = document.getElementById("cursorTrailCanvas");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canvas || reducedMotion) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const points = [];
    const maxPoints = 52;
    let deviceScale = 1;
    let animationFrame = 0;
    let pointerActive = false;
    let lastX = 0;
    let lastY = 0;

    function resizeCanvas() {
        deviceScale = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.floor(window.innerWidth * deviceScale);
        canvas.height = Math.floor(window.innerHeight * deviceScale);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
    }

    function addPoint(x, y) {
        const distance = Math.hypot(x - lastX, y - lastY);

        if (!pointerActive || distance >= 3) {
            points.push({ x, y, life: 1 });
            lastX = x;
            lastY = y;

            if (points.length > maxPoints) {
                points.splice(0, points.length - maxPoints);
            }
        }

        pointerActive = true;
    }

    window.addEventListener("pointermove", (event) => {
        addPoint(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        addPoint(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
        pointerActive = false;
    });

    function drawTrail() {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (const point of points) {
            point.life -= 0.05;
        }

        while (points.length && points[0].life <= 0) {
            points.shift();
        }

        if (points.length > 1) {
            context.save();
            context.globalCompositeOperation = "lighter";
            context.lineCap = "round";
            context.lineJoin = "round";
            context.shadowColor = "rgba(199, 152, 255, 0.96)";
            context.shadowBlur = 24;

            for (let index = 1; index < points.length; index += 1) {
                const previous = points[index - 1];
                const current = points[index];
                const alpha = Math.max(0, ((previous.life + current.life) / 2) * 0.80);

                context.beginPath();
                context.moveTo(previous.x, previous.y);
                context.lineTo(current.x, current.y);
                context.strokeStyle = `rgba(199, 152, 255, ${alpha})`;
                context.lineWidth = 1.2 + current.life * 4.4;
                context.stroke();

                if (index % 4 === 0) {
                    const blockSize = 2 + current.life * 3.5;
                    context.fillStyle = `rgba(225, 204, 255, ${current.life * 0.62})`;
                    context.fillRect(
                        current.x - blockSize / 2,
                        current.y - blockSize / 2,
                        blockSize,
                        blockSize
                    );
                }
            }

            const newest = points[points.length - 1];
            context.beginPath();
            context.arc(newest.x, newest.y, 3 + newest.life * 2.8, 0, Math.PI * 2);
            context.fillStyle = `rgba(239, 226, 255, ${newest.life * 0.92})`;
            context.fill();

            context.restore();
        }

        animationFrame = window.requestAnimationFrame(drawTrail);
    }

    function handleVisibility() {
        if (document.hidden) {
            window.cancelAnimationFrame(animationFrame);
        } else {
            animationFrame = window.requestAnimationFrame(drawTrail);
        }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = window.requestAnimationFrame(drawTrail);
}

function initializeMatrixRain() {
    const canvas = document.getElementById("matrixCanvas");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canvas || reducedMotion) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const characters = "01アイウエオカキクケコサシスセソABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/\\|";
    const fontSize = 15;
    let columns = 0;
    let drops = [];
    let animationFrame = 0;
    let lastFrameTime = 0;
    const frameInterval = 62;

    function resizeCanvas() {
        const deviceScale = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.floor(window.innerWidth * deviceScale);
        canvas.height = Math.floor(window.innerHeight * deviceScale);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

        columns = Math.ceil(window.innerWidth / fontSize);
        drops = Array.from({ length: columns }, () => {
            return Math.floor(Math.random() * -80);
        });
    }

    function draw(timestamp) {
        animationFrame = window.requestAnimationFrame(draw);

        if (timestamp - lastFrameTime < frameInterval) return;
        lastFrameTime = timestamp;

        context.fillStyle = "rgba(1, 4, 3, 0.10)";
        context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        context.font = `${fontSize}px "Share Tech Mono", monospace`;

        for (let index = 0; index < drops.length; index += 1) {
            const character = characters[Math.floor(Math.random() * characters.length)];
            const x = index * fontSize;
            const y = drops[index] * fontSize;

            const usePurple = index % 17 === 0;
            context.fillStyle = usePurple
                ? "rgba(199, 152, 255, 0.42)"
                : "rgba(66, 245, 141, 0.46)";

            context.fillText(character, x, y);

            if (y > window.innerHeight && Math.random() > 0.982) {
                drops[index] = Math.floor(Math.random() * -30);
            }

            drops[index] += 1;
        }
    }

    function handleVisibility() {
        if (document.hidden) {
            window.cancelAnimationFrame(animationFrame);
        } else {
            animationFrame = window.requestAnimationFrame(draw);
        }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = window.requestAnimationFrame(draw);
}

function initializeTerminal() {
    const terminalPanel = document.querySelector(".terminal-panel");
    const terminalOutput = document.getElementById("terminalOutput");
    const terminalForm = document.getElementById("terminalForm");
    const terminalInput = document.getElementById("terminalInput");
    const terminalSubmit = terminalForm?.querySelector(".terminal-submit");
    const terminalStatus = document.getElementById("terminalStatus");
    const matrixCanvas = document.getElementById("matrixCanvas");
    const trailCanvas = document.getElementById("cursorTrailCanvas");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
        !terminalPanel ||
        !terminalOutput ||
        !terminalForm ||
        !terminalInput ||
        !terminalSubmit
    ) {
        return;
    }

    const history = [];
    let historyIndex = 0;
    let commandBusy = false;
    let weatherSnapshot = null;

    const WEATHER_CACHE_KEY = "heath-portfolio-weather-v1";
    const WEATHER_CACHE_MAX_AGE = 10 * 60 * 1000;

    const destinations = {
        home: "index.html",
        projects: "projects.html",
        project: "projects.html",
        drone: "drone-reel.html",
        reel: "drone-reel.html",
        scans: "index.html#archaeology-scans",
        scan: "index.html#archaeology-scans",
        archaeology: "index.html#archaeology-scans",
        skills: "skills.html",
        work: "work-history.html",
        history: "work-history.html",
        contact: "contact.html"
    };

    const weatherDescriptions = {
        0: "clear sky",
        1: "mainly clear",
        2: "partly cloudy",
        3: "overcast",
        45: "fog",
        48: "depositing rime fog",
        51: "light drizzle",
        53: "drizzle",
        55: "heavy drizzle",
        56: "light freezing drizzle",
        57: "freezing drizzle",
        61: "light rain",
        63: "rain",
        65: "heavy rain",
        66: "light freezing rain",
        67: "freezing rain",
        71: "light snow",
        73: "snow",
        75: "heavy snow",
        77: "snow grains",
        80: "light rain showers",
        81: "rain showers",
        82: "heavy rain showers",
        85: "light snow showers",
        86: "heavy snow showers",
        95: "thunderstorm",
        96: "thunderstorm with light hail",
        99: "thunderstorm with heavy hail"
    };

    const sleep = (milliseconds) => {
        return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
    };

    // Animated command suggestions shown inside the empty terminal input.
    // These values are milliseconds, not pixels.
    const SUGGESTION_DELAY_MIN_MS = 70;
    const SUGGESTION_DELAY_MAX_MS = 130;
    const SUGGESTION_HOLD_MS = 1150;
    const SUGGESTION_GAP_MS = 260;

    const suggestedCommands = [
        "help",
        "status",
        "weather",
        "projects",
        "drone",
        "scans",
        "skills",
        "work",
        "contact",
        "date"
    ];

    function getRandomSuggestionDelay() {
        const range = SUGGESTION_DELAY_MAX_MS - SUGGESTION_DELAY_MIN_MS;

        return Math.round(
            SUGGESTION_DELAY_MIN_MS + Math.random() * range
        );
    }

    async function animateCommandSuggestions() {
        let commandIndex = 0;

        while (document.body.contains(terminalInput)) {
            if (
                terminalInput.disabled ||
                commandBusy ||
                terminalInput.value.length > 0
            ) {
                await sleep(180);
                continue;
            }

            const command = suggestedCommands[commandIndex];
            const suggestionText = `type "${command}"`;
            let interrupted = false;

            // Type the full suggestion, for example: type "help"
            for (let length = 1; length <= suggestionText.length; length += 1) {
                if (
                    terminalInput.disabled ||
                    commandBusy ||
                    terminalInput.value.length > 0
                ) {
                    interrupted = true;
                    break;
                }

                terminalInput.placeholder = suggestionText.slice(0, length);
                await sleep(getRandomSuggestionDelay());
            }

            if (!interrupted) {
                await sleep(SUGGESTION_HOLD_MS);
            }

            // Delete the full suggestion before showing the next command.
            for (let length = suggestionText.length - 1; length >= 0; length -= 1) {
                if (
                    terminalInput.disabled ||
                    commandBusy ||
                    terminalInput.value.length > 0
                ) {
                    interrupted = true;
                    break;
                }

                terminalInput.placeholder = suggestionText.slice(0, length);
                await sleep(getRandomSuggestionDelay());
            }

            if (
                !terminalInput.disabled &&
                !commandBusy &&
                terminalInput.value.length === 0
            ) {
                terminalInput.placeholder = "";
            }

            commandIndex = (commandIndex + 1) % suggestedCommands.length;
            await sleep(interrupted ? 180 : SUGGESTION_GAP_MS);
        }
    }

    function scrollToBottom() {
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function setStatus(text, state = "online") {
        if (!terminalStatus) return;

        terminalStatus.textContent = text;
        terminalStatus.classList.remove("is-booting", "is-online", "is-warning");
        terminalStatus.classList.add(`is-${state}`);
    }

    function setInputEnabled(enabled) {
        terminalInput.disabled = !enabled;
        terminalSubmit.disabled = !enabled;

        if (!enabled) {
            terminalInput.placeholder = "processing...";
        } else if (terminalInput.value.length === 0) {
            terminalInput.placeholder = "";
        }
    }

    function createLine(className = "terminal-info") {
        const paragraph = document.createElement("p");
        paragraph.className = className;
        terminalOutput.appendChild(paragraph);
        scrollToBottom();
        return paragraph;
    }

    function appendLine(text, className = "terminal-info") {
        const paragraph = createLine(className);
        paragraph.textContent = text;
        scrollToBottom();
        return paragraph;
    }

    function appendCommand(command) {
        const paragraph = createLine("terminal-command-line");

        const prompt = document.createElement("span");
        prompt.className = "prompt";
        prompt.textContent = "root@heath:~$";

        paragraph.append(prompt, document.createTextNode(command));
        scrollToBottom();
    }

    async function typeLine(
        text,
        className = "terminal-info",
        {
            prompt = false,
            speed = 16,
            pause = 100
        } = {}
    ) {
        const paragraph = createLine(`${className} terminal-typing`);

        if (prompt) {
            const promptElement = document.createElement("span");
            promptElement.className = "prompt";
            promptElement.textContent = "root@heath:~$";
            paragraph.appendChild(promptElement);
        }

        const textNode = document.createTextNode("");
        paragraph.appendChild(textNode);

        if (reducedMotion) {
            textNode.nodeValue = text;
        } else {
            for (const character of text) {
                textNode.nodeValue += character;
                scrollToBottom();

                const characterDelay = character === " "
                    ? Math.max(4, speed * 0.35)
                    : speed + Math.random() * 8;

                await sleep(characterDelay);
            }
        }

        paragraph.classList.remove("terminal-typing");
        scrollToBottom();

        if (pause > 0) {
            await sleep(reducedMotion ? 0 : pause);
        }

        return paragraph;
    }

    function formatLocalDate() {
        return new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short"
        }).format(new Date());
    }

    function getTemperatureUnit() {
        let region = "";

        try {
            region = new Intl.Locale(navigator.language).region || "";
        } catch {
            region = "";
        }

        const fahrenheitRegions = new Set([
            "US", "BS", "BZ", "KY", "LR", "MH", "FM", "PW"
        ]);

        return fahrenheitRegions.has(region) ? "fahrenheit" : "celsius";
    }

    function readWeatherCache() {
        try {
            const cached = JSON.parse(sessionStorage.getItem(WEATHER_CACHE_KEY));

            if (
                cached &&
                Date.now() - cached.savedAt < WEATHER_CACHE_MAX_AGE &&
                cached.weather
            ) {
                return cached.weather;
            }
        } catch {
            // Ignore storage failures and fetch live data.
        }

        return null;
    }

    function saveWeatherCache(weather) {
        try {
            sessionStorage.setItem(
                WEATHER_CACHE_KEY,
                JSON.stringify({
                    savedAt: Date.now(),
                    weather
                })
            );
        } catch {
            // Weather still works if storage is blocked.
        }
    }

    async function fetchJson(url, timeout = 7000) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json"
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function getIpLocation() {
        const data = await fetchJson("https://ipapi.co/json/", 6500);

        if (
            data.error ||
            !Number.isFinite(Number(data.latitude)) ||
            !Number.isFinite(Number(data.longitude))
        ) {
            throw new Error(data.reason || "IP location unavailable");
        }

        const locationLabel = [
            data.city,
            data.region_code,
            data.country_code
        ].filter(Boolean).join(", ");

        return {
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            label: locationLabel || "coarse network location",
            source: "coarse IP location"
        };
    }

    function getDeviceLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Browser geolocation is not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        label: "browser device location",
                        source: "browser geolocation"
                    });
                },
                (error) => {
                    reject(new Error(error.message || "Location permission denied"));
                },
                {
                    enableHighAccuracy: false,
                    timeout: 8000,
                    maximumAge: 15 * 60 * 1000
                }
            );
        });
    }

    async function fetchCurrentWeather(location) {
        const temperatureUnit = getTemperatureUnit();
        const windUnit = temperatureUnit === "fahrenheit" ? "mph" : "kmh";

        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(location.latitude));
        url.searchParams.set("longitude", String(location.longitude));
        url.searchParams.set(
            "current",
            "temperature_2m,apparent_temperature,weather_code,wind_speed_10m"
        );
        url.searchParams.set("temperature_unit", temperatureUnit);
        url.searchParams.set("wind_speed_unit", windUnit);
        url.searchParams.set("timezone", "auto");
        url.searchParams.set("forecast_days", "1");

        const data = await fetchJson(url.toString(), 7500);
        const current = data.current;

        if (!current) {
            throw new Error("Weather response did not include current conditions");
        }

        const degreeUnit = temperatureUnit === "fahrenheit" ? "F" : "C";
        const description = weatherDescriptions[current.weather_code] || "conditions unavailable";

        return {
            location: location.label,
            source: location.source,
            description,
            temperature: Math.round(current.temperature_2m),
            apparentTemperature: Math.round(current.apparent_temperature),
            windSpeed: Math.round(current.wind_speed_10m),
            degreeUnit,
            windUnit: windUnit === "mph" ? "mph" : "km/h",
            observationTime: current.time || null
        };
    }

    async function getWeather({
        precise = false,
        forceRefresh = false
    } = {}) {
        if (!precise && !forceRefresh) {
            const cachedWeather = readWeatherCache();

            if (cachedWeather) {
                weatherSnapshot = cachedWeather;
                return cachedWeather;
            }
        }

        const location = precise
            ? await getDeviceLocation()
            : await getIpLocation();

        const weather = await fetchCurrentWeather(location);
        weatherSnapshot = weather;

        if (!precise) {
            saveWeatherCache(weather);
        }

        return weather;
    }

    async function printWeather({
        precise = false,
        forceRefresh = false,
        typed = false
    } = {}) {
        const write = typed ? typeLine : async (text, className) => {
            appendLine(text, className);
        };

        const locationMode = precise
            ? "browser location permission"
            : "coarse network location";

        await write(
            `[INFO] resolving weather through ${locationMode}...`,
            "terminal-muted",
            { speed: 10, pause: 80 }
        );

        const weather = await getWeather({ precise, forceRefresh });

        await write(
            `[SUCCESS] weather link established: ${weather.location}`,
            "terminal-weather",
            { speed: 9, pause: 70 }
        );

        await write(
            `${weather.description.toUpperCase()} | ${weather.temperature}°${weather.degreeUnit} | feels ${weather.apparentTemperature}°${weather.degreeUnit} | wind ${weather.windSpeed} ${weather.windUnit}`,
            "terminal-weather-detail",
            { speed: 6, pause: 80 }
        );

        return weather;
    }

    async function navigate(target) {
        const destination = destinations[target];

        if (!destination) {
            appendLine(`Unknown destination: ${target}`, "terminal-error");
            appendLine(
                "Use: open projects | drone | scans | skills | work | contact",
                "terminal-muted"
            );
            return;
        }

        await typeLine(`[OPEN] ${destination}`, "terminal-purple", {
            speed: 8,
            pause: 80
        });

        window.setTimeout(() => {
            window.location.href = destination;
        }, 220);
    }

    async function runBootSequence() {
        commandBusy = true;
        setInputEnabled(false);
        setStatus("BOOTING", "booting");
        terminalOutput.replaceChildren();

        await typeLine("initialize --portfolio --network", "terminal-command-line", {
            prompt: true,
            speed: 23,
            pause: 190
        });

        await typeLine("[SUCCESS] document interface mounted", "terminal-success", {
            speed: 11,
            pause: 90
        });

        await typeLine("[SUCCESS] navigation routes verified", "terminal-success", {
            speed: 11,
            pause: 90
        });

        await typeLine("[SUCCESS] project archive indexed", "terminal-success", {
            speed: 11,
            pause: 90
        });

        await typeLine(
            `[SUCCESS] local clock synchronized: ${formatLocalDate()}`,
            "terminal-success",
            { speed: 8, pause: 130 }
        );

        await typeLine(
            "[PRIVACY] automatic weather uses a coarse IP-based city lookup; run “weather precise” to request browser location.",
            "terminal-privacy",
            { speed: 5, pause: 120 }
        );

        try {
            await printWeather({ typed: true });
        } catch (error) {
            await typeLine(
                `[WARN] automatic weather unavailable: ${error.message}`,
                "terminal-error",
                { speed: 7, pause: 90 }
            );

            await typeLine(
                '[INFO] type “weather precise” to request browser location or “weather” to retry.',
                "terminal-muted",
                { speed: 7, pause: 90 }
            );
        }

        await typeLine(
            '[READY] interactive shell active — type “help”',
            "terminal-success",
            { speed: 12, pause: 0 }
        );

        setStatus("ONLINE", "online");
        setInputEnabled(true);
        commandBusy = false;
    }

    async function runCommand(rawCommand) {
        const command = rawCommand.trim();
        if (!command || commandBusy) return;

        commandBusy = true;
        setInputEnabled(false);
        appendCommand(command);

        const parts = command.toLowerCase().split(/\s+/);
        const name = parts[0];
        const args = parts.slice(1);

        try {
            switch (name) {
                case "help":
                case "?":
                    [
                        "AVAILABLE COMMANDS",
                        "help                 show this command list",
                        "about | whoami       portfolio owner summary",
                        "status               system, clock, and weather status",
                        "ls                   list portfolio modules",
                        "projects             open project archive",
                        "drone | reel         open drone reel",
                        "scans                open archaeology scan area",
                        "skills               open technical skills",
                        "work                 open work history",
                        "contact              open contact page",
                        "open <target>        open a named portfolio page",
                        "weather              show cached/coarse local weather",
                        "weather refresh      refresh coarse IP weather",
                        "weather precise      request browser location permission",
                        "matrix on|off        toggle falling code",
                        "trail on|off         toggle purple cursor trace",
                        "date                 show browser-local date and time",
                        "boot                 replay the initialization sequence",
                        "clear                clear this terminal"
                    ].forEach((line, index) => {
                        appendLine(
                            line,
                            index === 0 ? "terminal-success" : "terminal-info"
                        );
                    });
                    break;

                case "about":
                case "whoami":
                    appendLine("Heath Lyon // FAA Part 107 drone pilot", "terminal-success");
                    appendLine(
                        "FPV cinematography, custom drone systems, software, computer vision, embedded electronics, and 3D archives.",
                        "terminal-info"
                    );
                    break;

                case "status":
                    appendLine("PORTFOLIO........ ONLINE", "terminal-success");
                    appendLine("FLIGHT SYSTEMS... READY", "terminal-success");
                    appendLine("3D ARCHIVE........ STANDBY", "terminal-purple");
                    appendLine("MATRIX LINK....... ACTIVE", "terminal-success");
                    appendLine(`LOCAL CLOCK....... ${formatLocalDate()}`, "terminal-info");

                    if (weatherSnapshot) {
                        appendLine(
                            `WEATHER........... ${weatherSnapshot.temperature}°${weatherSnapshot.degreeUnit}, ${weatherSnapshot.description}`,
                            "terminal-weather"
                        );
                    } else {
                        appendLine("WEATHER........... NOT CACHED", "terminal-muted");
                    }
                    break;

                case "ls":
                case "dir":
                    [
                        "drone-reel/",
                        "projects/",
                        "archaeology-scans/",
                        "skills/",
                        "work-history/",
                        "contact/"
                    ].forEach((line) => appendLine(line, "terminal-purple"));
                    break;

                case "projects":
                case "project":
                case "drone":
                case "reel":
                case "scans":
                case "scan":
                case "archaeology":
                case "skills":
                case "work":
                case "contact":
                    await navigate(name);
                    break;

                case "open":
                case "cd":
                    if (!args[0]) {
                        appendLine(
                            "Usage: open <projects|drone|scans|skills|work|contact>",
                            "terminal-error"
                        );
                    } else {
                        await navigate(args[0]);
                    }
                    break;

                case "date":
                case "time":
                    appendLine(formatLocalDate(), "terminal-success");
                    break;

                case "weather":
                    await printWeather({
                        precise: args[0] === "precise",
                        forceRefresh: args[0] === "refresh"
                    });
                    break;

                case "matrix":
                    if (!args[0] || !["on", "off"].includes(args[0])) {
                        appendLine("Usage: matrix on | matrix off", "terminal-error");
                        break;
                    }

                    if (matrixCanvas) {
                        matrixCanvas.hidden = args[0] === "off";
                    }

                    appendLine(`Matrix rain ${args[0]}.`, "terminal-purple");
                    break;

                case "trail":
                    if (!args[0] || !["on", "off"].includes(args[0])) {
                        appendLine("Usage: trail on | trail off", "terminal-error");
                        break;
                    }

                    if (trailCanvas) {
                        trailCanvas.hidden = args[0] === "off";
                    }

                    appendLine(`Purple cursor trace ${args[0]}.`, "terminal-purple");
                    break;

                case "boot":
                case "initialize":
                    commandBusy = false;
                    await runBootSequence();
                    return;

                case "clear":
                case "cls":
                    terminalOutput.replaceChildren();
                    break;

                case "sudo":
                    appendLine(
                        "Permission denied: public portfolio shell.",
                        "terminal-error"
                    );
                    break;

                default:
                    appendLine(`Command not found: ${name}`, "terminal-error");
                    appendLine(
                        'Type “help” for available commands.',
                        "terminal-muted"
                    );
            }
        } catch (error) {
            setStatus("DEGRADED", "warning");
            appendLine(`[ERROR] ${error.message}`, "terminal-error");
            appendLine(
                "The portfolio remains available; retry the command or continue through the navigation.",
                "terminal-muted"
            );
        } finally {
            commandBusy = false;
            setInputEnabled(true);
            terminalInput.focus({ preventScroll: true });
        }
    }

    terminalForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const command = terminalInput.value.trim();
        if (!command || commandBusy) return;

        history.push(command);
        historyIndex = history.length;
        terminalInput.value = "";
        void runCommand(command);
    });

    terminalInput.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (historyIndex > 0) {
                historyIndex -= 1;
                terminalInput.value = history[historyIndex];
                terminalInput.setSelectionRange(
                    terminalInput.value.length,
                    terminalInput.value.length
                );
            }
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (historyIndex < history.length - 1) {
                historyIndex += 1;
                terminalInput.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                terminalInput.value = "";
            }
        }

        if (event.key === "Tab") {
            event.preventDefault();

            const value = terminalInput.value.toLowerCase();
            const commands = [
                "help",
                "about",
                "whoami",
                "status",
                "ls",
                "projects",
                "drone",
                "reel",
                "scans",
                "skills",
                "work",
                "contact",
                "open",
                "weather",
                "weather refresh",
                "weather precise",
                "matrix",
                "trail",
                "date",
                "boot",
                "clear"
            ];

            const match = commands.find((commandName) => {
                return commandName.startsWith(value);
            });

            if (match) {
                terminalInput.value = match;
                terminalInput.setSelectionRange(match.length, match.length);
            }
        }
    });

    terminalPanel.addEventListener("click", (event) => {
        if (!event.target.closest("button, a") && !terminalInput.disabled) {
            terminalInput.focus();
        }
    });

    void runBootSequence().then(() => {
        void animateCommandSuggestions();
    });
}

function initializeIntro() {
    const introScreen = document.getElementById("introScreen");
    const introSkip = document.getElementById("introSkip");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!introScreen) {
        document.body.classList.remove("intro-active");
        return;
    }

    const displayTime = reducedMotion ? 800 : 2700;
    const exitTime = 720;

    let hasClosed = false;
    let displayTimer;

    function finishIntro() {
        introScreen.remove();
        document.body.classList.remove("intro-active");
        document.removeEventListener("keydown", handleIntroKey);

        document.dispatchEvent(
            new CustomEvent("portfolio:introComplete")
        );
    }

    function closeIntro() {
        if (hasClosed) return;

        hasClosed = true;
        window.clearTimeout(displayTimer);

        introScreen.classList.add("is-exiting");
        introScreen.setAttribute("aria-hidden", "true");
        document.body.classList.remove("intro-active");

        window.setTimeout(finishIntro, exitTime);
    }

    function handleIntroKey(event) {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
            closeIntro();
        }
    }

    introSkip?.addEventListener("click", closeIntro);
    document.addEventListener("keydown", handleIntroKey);

    const introImages = [...introScreen.querySelectorAll("img")];

    const imageReady = introImages.map((image) => {
        if (image.complete) {
            return image.decode?.().catch(() => undefined) ?? Promise.resolve();
        }

        return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
        });
    });

    Promise.race([
        Promise.all(imageReady),
        new Promise((resolve) => window.setTimeout(resolve, 700))
    ]).finally(() => {
        window.requestAnimationFrame(() => {
            introScreen.classList.add("is-ready");
            displayTimer = window.setTimeout(closeIntro, displayTime);
        });
    });
}

initializeCursorField();
initializeCursorTrail();
initializeMatrixRain();

const hasIntroScreen = Boolean(document.getElementById("introScreen"));

if (hasIntroScreen) {
    document.addEventListener(
        "portfolio:introComplete",
        initializeTerminal,
        { once: true }
    );

    initializeIntro();
} else {
    initializeTerminal();
}