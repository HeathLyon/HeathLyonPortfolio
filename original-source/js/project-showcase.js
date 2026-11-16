"use strict";

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

document.addEventListener(
  "pointermove",
  (event) => {
    document.documentElement.style.setProperty("--x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--y", `${event.clientY}px`);
  },
  { passive: true },
);

document.querySelectorAll('[aria-disabled="true"]').forEach((element) => {
  element.addEventListener("click", (event) => event.preventDefault());
});

const yoloVideo = document.querySelector("[data-yolo-video]");
const yoloVideoSource = document.querySelector("[data-yolo-video-source]");
const videoMissingNote = document.querySelector("[data-video-missing]");

if (yoloVideo && videoMissingNote) {
  const showMissingVideoMessage = () => {
    videoMissingNote.hidden = false;
  };

  const hideMissingVideoMessage = () => {
    videoMissingNote.hidden = true;
  };

  yoloVideoSource?.addEventListener("error", showMissingVideoMessage);
  yoloVideo.addEventListener("error", showMissingVideoMessage);
  yoloVideo.addEventListener("loadedmetadata", hideMissingVideoMessage);
}

const showcase = document.querySelector("[data-showcase]");

if (showcase) {
  const slides = [...showcase.querySelectorAll("[data-slide]")];
  const dots = [...showcase.querySelectorAll("[data-slide-to]")];
  const previousButton = showcase.querySelector("[data-previous]");
  const nextButton = showcase.querySelector("[data-next]");
  const playButton = showcase.querySelector("[data-play]");
  const counter = showcase.querySelector("[data-counter]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let current = 0;
  let timer = null;

  function render(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "step" : "false");
    });
    if (counter) {
      counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(
        slides.length,
      ).padStart(2, "0")}`;
    }
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
    if (playButton) playButton.textContent = "▶ AUTO PLAY";
  }

  function play() {
    if (prefersReducedMotion) return;
    stop();
    timer = window.setInterval(() => render(current + 1), 5200);
    if (playButton) playButton.textContent = "Ⅱ PAUSE";
  }

  previousButton?.addEventListener("click", () => {
    stop();
    render(current - 1);
  });

  nextButton?.addEventListener("click", () => {
    stop();
    render(current + 1);
  });

  playButton?.addEventListener("click", () => {
    if (timer) stop();
    else play();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      stop();
      render(Number(dot.dataset.slideTo));
    });
  });

  showcase.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      stop();
      render(current - 1);
    }
    if (event.key === "ArrowRight") {
      stop();
      render(current + 1);
    }
  });

  render(0);
}

const filters = [...document.querySelectorAll("[data-filter]")];
const downloadCards = [...document.querySelectorAll("[data-category]")];

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    downloadCards.forEach((card) => {
      const categories = card.dataset.category.split(" ");
      card.hidden = filter !== "all" && !categories.includes(filter);
    });
  });
});