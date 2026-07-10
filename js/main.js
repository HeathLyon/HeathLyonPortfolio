const header = document.getElementById("siteHeader");
const footer = document.getElementById("siteFooter");

if (header) {
    header.innerHTML = `
        <header class="site-header">
            <nav class="navbar">
                <a class="logo" href="index.html">Heath Lyon</a>

                <button class="menu-button" id="menuButton" aria-label="Open menu">
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
            <p>&copy; <span id="currentYear"></span> Heath Lyon. All rights reserved.</p>
            <p class="last-updated">Last updated: <span id="lastUpdated"></span></p>
        </footer>
    `;
}

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => {
        navLinks.classList.toggle("show");
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
        weekday: "short",
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
    }
});


// Intro screen logic
window.addEventListener("load", () => {
    const introScreen = document.getElementById("introScreen");

    if (!introScreen) return;

    const minimumIntroTime = 1800;
    const fadeDuration = 1100;

    setTimeout(() => {
        introScreen.classList.add("hide-intro");
    }, minimumIntroTime);

    setTimeout(() => {
        introScreen.remove();
    }, minimumIntroTime + fadeDuration + 200);
});