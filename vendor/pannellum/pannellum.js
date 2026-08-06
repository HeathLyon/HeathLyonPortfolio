"use strict";

(() => {
  const query = new URLSearchParams(window.location.search);
  if (query.get("embed") === "1") {
    document.body.classList.add("tour-embed-mode");
  }

  const panoramaElement = document.querySelector("#panorama");
  const tourRoot = document.querySelector("[data-tour-demo]");

  if (!panoramaElement || !tourRoot || typeof window.pannellum === "undefined") {
    return;
  }

  const sceneNames = {
    scene1: "SCENE 01 // OVERVIEW",
    scene2: "SCENE 02 // VIEWPOINT",
    scene3: "SCENE 03 // FINAL VIEW",
  };

  const sceneFiles = {
    scene1: "360img1.webp",
    scene2: "360img2.webp",
    scene3: "360img3.webp",
  };

  const scenePaths = {
    scene1: "images/logo/360/360img1.webp",
    scene2: "images/logo/360/360img2.webp",
    scene3: "images/logo/360/360img3.webp",
  };

  const loading = document.querySelector("#tourLoading");
  const loadingFile = loading?.querySelector("small");
  const errorMessage = document.querySelector("#tourError");
  const errorText = document.querySelector("#tourErrorMessage");
  const errorPath = document.querySelector("#tourErrorPath");
  const retryButton = document.querySelector("#tourRetry");
  const sceneReadout = document.querySelector("#sceneReadout");
  const help = document.querySelector("#tourHelp");
  const sceneButtons = [...document.querySelectorAll("[data-scene]")];
  const controlButtons = [...document.querySelectorAll("[data-tour-control]")];
  const motionButton = document.querySelector('[data-tour-control="motion"]');
  let currentScene = "scene1";
  let motionActive = false;
  let loadingTimer = null;

  const viewer = window.pannellum.viewer("panorama", {
    default: {
      firstScene: "scene1",
      autoLoad: true,
      sceneFadeDuration: 850,
      showControls: false,
      showFullscreenCtrl: false,
      keyboardZoom: true,
      mouseZoom: true,
      draggable: true,
      friction: 0.16,
      hfov: 100,
      minHfov: 45,
      maxHfov: 120,
      pitch: 0,
      yaw: 0,
      autoRotateInactivityDelay: -1,
    },
    scenes: {
      scene1: {
        title: "360 View 01 — Overview",
        type: "equirectangular",
        panorama: scenePaths.scene1,
        hotSpots: [
          {
            pitch: -4,
            yaw: 75,
            type: "scene",
            text: "Continue to Viewpoint",
            sceneId: "scene2",
            targetPitch: 0,
            targetYaw: -55,
          },
        ],
      },
      scene2: {
        title: "360 View 02 — Viewpoint",
        type: "equirectangular",
        panorama: scenePaths.scene2,
        hotSpots: [
          {
            pitch: -3,
            yaw: -72,
            type: "scene",
            text: "Return to Overview",
            sceneId: "scene1",
            targetPitch: 0,
            targetYaw: 55,
          },
          {
            pitch: -2,
            yaw: 72,
            type: "scene",
            text: "Continue to Final View",
            sceneId: "scene3",
            targetPitch: 0,
            targetYaw: -45,
          },
        ],
      },
      scene3: {
        title: "360 View 03 — Final View",
        type: "equirectangular",
        panorama: scenePaths.scene3,
        hotSpots: [
          {
            pitch: -3,
            yaw: -68,
            type: "scene",
            text: "Back to Viewpoint",
            sceneId: "scene2",
            targetPitch: 0,
            targetYaw: 52,
          },
          {
            pitch: -1,
            yaw: 68,
            type: "scene",
            text: "Restart Tour",
            sceneId: "scene1",
            targetPitch: 0,
            targetYaw: 0,
          },
        ],
      },
    },
  });

  function setLoading(sceneId) {
    window.clearTimeout(loadingTimer);
    if (errorMessage) errorMessage.hidden = true;
    loading?.classList.remove("is-hidden");
    if (loadingFile) loadingFile.textContent = sceneFiles[sceneId] || "360 scene";

    loadingTimer = window.setTimeout(() => {
      if (viewer.isLoaded()) {
        finishLoading();
        return;
      }

      const path = scenePaths[sceneId];
      const probe = new Image();

      probe.onload = () => {
        window.setTimeout(() => {
          if (viewer.isLoaded()) {
            finishLoading();
          } else {
            showTourError(
              "The image file was found, but the browser could not render it. Export a 2:1 panorama at 4096 × 2048 or 6000 × 3000 pixels.",
              path,
            );
          }
        }, 1400);
      };

      probe.onerror = () => {
        showTourError(
          "The panorama URL could not be opened. Confirm the filename, capitalization, folder location, and that the file was uploaded.",
          path,
        );
      };

      probe.src = path;
    }, 10000);
  }

  function finishLoading() {
    window.clearTimeout(loadingTimer);
    loading?.classList.add("is-hidden");
    if (errorMessage) errorMessage.hidden = true;
  }

  function showTourError(message, path) {
    window.clearTimeout(loadingTimer);
    loading?.classList.add("is-hidden");
    if (errorText) errorText.textContent = message;
    if (errorPath) errorPath.textContent = path || scenePaths[currentScene];
    if (errorMessage) errorMessage.hidden = false;
  }

  function setActiveScene(sceneId) {
    currentScene = sceneId;
    if (sceneReadout) sceneReadout.textContent = sceneNames[sceneId] || "360° SCENE";

    sceneButtons.forEach((button) => {
      const isActive = button.dataset.scene === sceneId;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function loadScene(sceneId) {
    if (!sceneFiles[sceneId] || sceneId === currentScene) return;
    setLoading(sceneId);
    viewer.loadScene(sceneId);
  }

  async function toggleMotion() {
    if (motionActive) {
      viewer.stopOrientation();
      motionActive = false;
    } else {
      try {
        if (
          typeof window.DeviceOrientationEvent !== "undefined" &&
          typeof window.DeviceOrientationEvent.requestPermission === "function"
        ) {
          const permission = await window.DeviceOrientationEvent.requestPermission();
          if (permission !== "granted") throw new Error("Motion permission denied");
        }

        viewer.startOrientation();
        motionActive = true;
      } catch (error) {
        motionActive = false;
        if (help) help.textContent = "Motion was not enabled. You can still drag or swipe the view.";
      }
    }

    motionButton?.setAttribute("aria-pressed", String(motionActive));
    if (motionButton) motionButton.textContent = motionActive ? "STOP MOTION" : "ENABLE MOTION";
  }

  sceneButtons.forEach((button) => {
    button.addEventListener("click", () => loadScene(button.dataset.scene));
  });

  controlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switch (button.dataset.tourControl) {
        case "zoom-in":
          viewer.setHfov(Math.max(45, viewer.getHfov() - 10));
          break;
        case "zoom-out":
          viewer.setHfov(Math.min(120, viewer.getHfov() + 10));
          break;
        case "reset":
          viewer.lookAt(0, 0, 100, 650);
          break;
        case "motion":
          toggleMotion();
          break;
        case "fullscreen":
          viewer.toggleFullscreen();
          break;
        default:
          break;
      }
    });
  });

  viewer.on("scenechange", (sceneId) => {
    setActiveScene(sceneId);
    setLoading(sceneId);
  });

  viewer.on("load", () => {
    finishLoading();
    setActiveScene(viewer.getScene());
  });

  viewer.on("error", (message) => {
    showTourError(
      message || "The panorama could not be loaded by the 360° viewer.",
      scenePaths[currentScene],
    );
  });

  retryButton?.addEventListener("click", () => {
    setLoading(currentScene);
    viewer.loadScene(currentScene);
  });

  document.addEventListener("fullscreenchange", () => {
    const fullscreenButton = document.querySelector('[data-tour-control="fullscreen"]');
    if (fullscreenButton) {
      fullscreenButton.textContent = document.fullscreenElement ? "EXIT FULLSCREEN" : "FULLSCREEN";
    }
  });

  setActiveScene(currentScene);
  setLoading(currentScene);

  const readinessCheck = window.setInterval(() => {
    if (!viewer.isLoaded()) return;
    finishLoading();
    setActiveScene(viewer.getScene());
    window.clearInterval(readinessCheck);
  }, 250);
})();