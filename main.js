// =========================
// MOBILE MENU
// =========================

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    document.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
        });
    });
}

// =========================
// CURRENT YEAR
// =========================

const currentYear = document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

// =========================
// LAST UPDATED DATE AND TIME
// Uses document.lastModified.
// This updates when the HTML file is changed and saved.
// =========================

const lastUpdated = document.getElementById("lastUpdated");

if (lastUpdated) {
    const modifiedDate = new Date(document.lastModified);

    const formattedDate = modifiedDate.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
    });

    lastUpdated.textContent = formattedDate;
}

// =========================
// SIMPLE SCROLL REVEAL
// =========================

const revealItems = document.querySelectorAll(
    ".highlight-card, .project-card, .timeline-item, .skills-grid article, .contact-card"
);

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    },
    {
        threshold: 0.15
    }
);

revealItems.forEach((item) => {
    item.classList.add("hidden");
    observer.observe(item);
});