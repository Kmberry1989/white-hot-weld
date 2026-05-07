import type { EffectPreset } from "../../types/effects";

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

interface ModelViewerElement extends HTMLElement {
  animationName?: string;
  availableAnimations?: string[];
  currentTime?: number;
  duration?: number;
  pause?: () => void;
}

const MODEL_VIEWER_SRC = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
const MOTORCYCLE_RIDE_SESSION_KEY = "whw-motorcycle-ride-played";

let cleanupMotorcycleRide: (() => void) | null = null;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function shouldDisableMotorcycleRide(disabledFlag: boolean): boolean {
  if (disabledFlag) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return false;
}

function ensureModelViewerLoaded(): void {
  if (customElements.get("model-viewer")) {
    return;
  }

  const win = window as Window & { __whwModelViewerLoading?: boolean };
  if (win.__whwModelViewerLoading) {
    return;
  }

  win.__whwModelViewerLoading = true;
  const script = document.createElement("script");
  script.type = "module";
  script.src = MODEL_VIEWER_SRC;
  script.async = true;
  script.addEventListener("error", () => {
    win.__whwModelViewerLoading = false;
  });
  script.addEventListener("load", () => {
    win.__whwModelViewerLoading = false;
  });
  document.head.append(script);
}

function hasMotorcycleRidePlayedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(MOTORCYCLE_RIDE_SESSION_KEY) === "true";
  } catch {
    const win = window as Window & { __whwMotorcycleRidePlayed?: boolean };
    return Boolean(win.__whwMotorcycleRidePlayed);
  }
}

function markMotorcycleRidePlayedThisSession(): void {
  try {
    window.sessionStorage.setItem(MOTORCYCLE_RIDE_SESSION_KEY, "true");
  } catch {
    // Fall through to runtime flag.
  }
  const win = window as Window & { __whwMotorcycleRidePlayed?: boolean };
  win.__whwMotorcycleRidePlayed = true;
}

export function initMotorcycleRide(_layer: HTMLElement, _preset: EffectPreset | string, disabledFlag = false): void {
  if (cleanupMotorcycleRide) {
    cleanupMotorcycleRide();
    cleanupMotorcycleRide = null;
  }

  if (shouldDisableMotorcycleRide(disabledFlag)) {
    return;
  }

  const runner = document.querySelector<HTMLElement>("[data-motorcycle-runner]");
  const track = document.querySelector<HTMLElement>("[data-motorcycle-track]");
  const model = document.querySelector<ModelViewerElement>("[data-motorcycle-model]");
  const smokeCanvas = document.querySelector<HTMLCanvasElement>("[data-motorcycle-smoke]");

  if (!runner || !track || !model || !smokeCanvas) {
    return;
  }

  runner.dataset.active = "false";
  track.style.opacity = "0";
  track.dataset.motionBlur = "0";
  track.style.setProperty("--motorcycle-motion-blur", "0px");

  if (hasMotorcycleRidePlayedThisSession()) {
    return;
  }

  const smokeCtx = smokeCanvas.getContext("2d");
  if (!smokeCtx) {
    return;
  }

  ensureModelViewerLoaded();

  let rafId = 0;
  let width = Math.max(1, window.innerWidth);
  let height = Math.max(1, window.innerHeight);
  let hidden = document.hidden;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const isMobileViewport = (): boolean => window.innerWidth < 760;

  let outboundProgress = 0;
  let returnStarted = false;
  let returnProgress = 0;
  let parked = false;
  let sequenceFinished = false;

  let wheelieAmount = 0;
  let wheeliePeakReached = false;

  const triggerDelayMs = 2000;
  const outboundDurationSeconds = isMobileViewport() ? 4.8 : 5.8;
  const returnDurationSeconds = isMobileViewport() ? 2.05 : 2.5;
  const showcaseStartDelayMs = 1700;
  const showcaseSpinSpeedDegPerSecond = 11;
  const fadeStartDelayMs = isMobileViewport() ? 450 : 1050;
  const fadeDurationMs = isMobileViewport() ? 900 : 1400;
  let motionSign = -1;
  let triggerArmed = false;
  let triggerReady = false;
  let triggerReleaseAt = 0;
  let parkedAtTime = 0;

  let animationReady = false;
  let animationDuration = 0;
  let wheelAnimationTime = 0;
  let lastTrackX = Number.NaN;
  let lastFrameTime = 0;
  let animationLoadToken = 0;
  let fadedOut = false;

  let smokeAccumulator = 0;
  let smokeParticles: SmokeParticle[] = [];

  const resize = (): void => {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    smokeCanvas.width = Math.floor(width * dpr);
    smokeCanvas.height = Math.floor(height * dpr);
    smokeCanvas.style.width = `${width}px`;
    smokeCanvas.style.height = `${height}px`;
    smokeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const onVisibility = (): void => {
    hidden = document.hidden;
  };

  const onModelLoad = (): void => {
    const loadToken = ++animationLoadToken;
    const availableAnimations = model.availableAnimations ?? [];

    if (model.pause) {
      model.pause();
    }

    if (availableAnimations.length === 0) {
      animationDuration = Number(model.duration ?? 0);
      animationReady = Number.isFinite(animationDuration) && animationDuration > 0;
      wheelAnimationTime = 0;
      if (animationReady && typeof model.currentTime === "number") {
        model.currentTime = 0;
      }
      return;
    }

    void (async () => {
      let bestName = availableAnimations[0];
      let bestDuration = 0;

      for (const candidate of availableAnimations) {
        model.animationName = candidate;
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        const candidateDuration = Number(model.duration ?? 0);
        const isEmpty = candidate.toLowerCase().includes("empty");
        const currentBestIsEmpty = bestName.toLowerCase().includes("empty");

        if (
          candidateDuration > bestDuration ||
          (candidateDuration === bestDuration && !isEmpty && currentBestIsEmpty)
        ) {
          bestName = candidate;
          bestDuration = candidateDuration;
        }
      }

      model.animationName = bestName;
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const resolvedDuration = Number(model.duration ?? bestDuration);

      if (loadToken !== animationLoadToken) {
        return;
      }

      animationDuration = resolvedDuration;
      animationReady = Number.isFinite(animationDuration) && animationDuration > 0;
      wheelAnimationTime = 0;
      if (animationReady && typeof model.currentTime === "number") {
        model.currentTime = 0;
      }
    })();
  };

  const bottomRevealProgress = (): number => {
    const viewportBottom = window.scrollY + window.innerHeight;
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.offsetHeight
    );
    const distance = Math.max(0, docHeight - viewportBottom);
    const range = Math.max(360, Math.min(1100, window.innerHeight * 1.35));
    return clamp(1 - distance / range, 0, 1);
  };

  const spawnSmoke = (dtSeconds: number, direction: number, returnPhase: boolean): void => {
    if (sequenceFinished) {
      return;
    }

    const emissionMultiplier = returnPhase ? 2.35 : 1;
    smokeAccumulator += dtSeconds * 7.5 * emissionMultiplier;
    const rect = track.getBoundingClientRect();
    const tailAnchorX = direction < 0 ? rect.right - rect.width * 0.24 : rect.left + rect.width * 0.24;

    while (smokeAccumulator >= 1) {
      smokeAccumulator -= 1;
      const life = randomBetween(0.9, returnPhase ? 2.2 : 1.8);
      const size = randomBetween(returnPhase ? 12 : 9, returnPhase ? 24 : 19);
      const alpha = randomBetween(returnPhase ? 0.13 : 0.08, returnPhase ? 0.25 : 0.18);
      const velocityScale = returnPhase ? 1.35 : 1;

      smokeParticles.push({
        x: tailAnchorX + randomBetween(-8, 8),
        y: rect.bottom - rect.height * randomBetween(0.15, 0.36),
        vx: (direction < 0 ? 1 : -1) * randomBetween(14, 56) * velocityScale,
        vy: randomBetween(-16, -5),
        life,
        maxLife: life,
        size,
        alpha
      });
    }

    if (smokeParticles.length > 260) {
      smokeParticles = smokeParticles.slice(smokeParticles.length - 240);
    }
  };

  const renderSmoke = (dtSeconds: number): void => {
    smokeCtx.clearRect(0, 0, width, height);

    const next: SmokeParticle[] = [];

    for (const particle of smokeParticles) {
      particle.life -= dtSeconds;
      if (particle.life <= 0) {
        continue;
      }

      particle.x += particle.vx * dtSeconds;
      particle.y += particle.vy * dtSeconds;
      particle.vx *= 0.985;
      particle.vy -= dtSeconds * 2.2;
      particle.size += dtSeconds * 19;

      const lifeRatio = particle.life / Math.max(particle.maxLife, 0.01);
      const alpha = particle.alpha * lifeRatio;

      const gradient = smokeCtx.createRadialGradient(
        particle.x,
        particle.y,
        particle.size * 0.18,
        particle.x,
        particle.y,
        particle.size
      );
      gradient.addColorStop(0, `rgba(240, 236, 229, ${alpha})`);
      gradient.addColorStop(0.42, `rgba(196, 191, 184, ${alpha * 0.64})`);
      gradient.addColorStop(1, "rgba(150, 146, 141, 0)");

      smokeCtx.fillStyle = gradient;
      smokeCtx.beginPath();
      smokeCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      smokeCtx.fill();

      next.push(particle);
    }

    smokeParticles = next;
  };

  const updateModelAnimation = (deltaX: number): void => {
    if (!animationReady || typeof model.currentTime !== "number") {
      return;
    }

    const distance = Math.abs(deltaX);
    if (distance > 0.02) {
      const spinMultiplier = returnStarted && !parked ? 0.007 : 0.0053;
      wheelAnimationTime = (wheelAnimationTime + distance * spinMultiplier) % animationDuration;
    }

    model.currentTime = wheelAnimationTime;
  };

  const tick = (now: number): void => {
    rafId = window.requestAnimationFrame(tick);

    if (!lastFrameTime) {
      lastFrameTime = now;
    }

    const dtSeconds = clamp((now - lastFrameTime) / 1000, 1 / 120, 1 / 20);
    lastFrameTime = now;

    if (hidden) {
      return;
    }

    if (!returnStarted && !sequenceFinished) {
      const reveal = bottomRevealProgress();
      if (!triggerArmed && reveal >= 0.07) {
        triggerArmed = true;
        triggerReleaseAt = now + triggerDelayMs;
      }

      if (!triggerReady && triggerArmed && now >= triggerReleaseAt) {
        triggerReady = true;
        markMotorcycleRidePlayedThisSession();
      }

      if (triggerReady) {
        outboundProgress += dtSeconds / outboundDurationSeconds;
        outboundProgress = clamp(outboundProgress, 0, 1);
      } else {
        outboundProgress = 0;
      }

      if (outboundProgress > 0.02) {
        runner.dataset.active = "true";
      }

      if (!wheeliePeakReached && outboundProgress >= 0.5) {
        wheeliePeakReached = true;
      }

      const wheelieEnvelope = wheeliePeakReached
        ? Math.sin(clamp((outboundProgress - 0.5) / 0.32, 0, 1) * Math.PI)
        : 0;
      wheelieAmount += (wheelieEnvelope - wheelieAmount) * 0.12;

      if (outboundProgress >= 0.995) {
        returnStarted = true;
      }

      motionSign = -1;
    } else if (returnStarted && !parked) {
      returnProgress = clamp(returnProgress + dtSeconds / returnDurationSeconds, 0, 1);
      wheelieAmount += (0 - wheelieAmount) * 0.1;
      motionSign = 1;

      if (returnProgress >= 1) {
        parked = true;
        sequenceFinished = true;
        parkedAtTime = now;
      }
    }

    const trackWidth = track.offsetWidth || width * 0.28;
    const startRight = width + trackWidth * 1.15;
    const offLeft = -trackWidth * 1.25;
    const parkedRight = width - trackWidth * 1.28;

    const outboundEased = easeInOutCubic(outboundProgress);
    const outboundX = startRight + (offLeft - startRight) * outboundEased;
    const returnEased = easeInOutCubic(returnProgress);
    const returnX = offLeft + (parkedRight - offLeft) * returnEased;

    const x = returnStarted ? returnX : outboundX;
    if (!Number.isFinite(lastTrackX)) {
      lastTrackX = x;
    }
    const deltaX = x - lastTrackX;
    lastTrackX = x;

    const fadeElapsed = parked ? Math.max(0, now - parkedAtTime - fadeStartDelayMs) : 0;
    const fadeProgress = parked ? clamp(fadeElapsed / fadeDurationMs, 0, 1) : 0;
    if (parked && fadeProgress >= 1) {
      fadedOut = true;
    }

    const lift = -48 * wheelieAmount;
    const tilt = (returnStarted ? 6 : 0) + (returnStarted ? -12 : 12) * wheelieAmount;
    const scale = returnStarted ? 1.06 - returnEased * 0.2 : 1.02;
    const mirror = returnStarted ? 1 : -1;
    const opacityTarget = parked ? 0.95 * (1 - fadeProgress) : 1;
    const currentOpacity = Number(track.dataset.opacity ?? "0");
    const nextOpacity = currentOpacity + (opacityTarget - currentOpacity) * 0.08;
    track.dataset.opacity = String(nextOpacity);

    const motionBlurTarget = returnStarted && !parked ? 1.7 + Math.sin(returnProgress * Math.PI) * 1.25 : 0;
    const currentMotionBlur = Number(track.dataset.motionBlur ?? "0");
    const nextMotionBlur = currentMotionBlur + (motionBlurTarget - currentMotionBlur) * 0.14;
    track.dataset.motionBlur = String(nextMotionBlur);

    track.style.opacity = nextOpacity.toFixed(3);
    track.style.setProperty("--motorcycle-motion-blur", `${nextMotionBlur.toFixed(2)}px`);
    track.style.transform = `translate3d(${x.toFixed(2)}px, ${lift.toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)}) scaleX(${mirror})`;

    if (parked && fadeProgress < 1) {
      const showcaseElapsed = Math.max(0, now - parkedAtTime - showcaseStartDelayMs);
      const showcaseSpin = (showcaseElapsed / 1000) * showcaseSpinSpeedDegPerSecond;
      const showcaseOrbit = -58 + showcaseSpin;
      const showcasePitch = 77 + Math.sin(showcaseElapsed / 1000) * 1.1;
      model.setAttribute("camera-orbit", `${showcaseOrbit.toFixed(2)}deg ${showcasePitch.toFixed(2)}deg 84%`);
      model.setAttribute("field-of-view", "30deg");
    } else if (parked) {
      model.setAttribute("camera-orbit", "-58deg 77deg 84%");
      model.setAttribute("field-of-view", "30deg");
    } else if (returnStarted) {
      model.setAttribute("camera-orbit", "-72deg 76deg 72%");
      model.setAttribute("field-of-view", "26deg");
    } else {
      model.setAttribute("camera-orbit", "-92deg 77deg 70%");
      model.setAttribute("field-of-view", "25deg");
    }

    updateModelAnimation(deltaX);

    spawnSmoke(dtSeconds, motionSign, returnStarted && !parked && !fadedOut);
    renderSmoke(dtSeconds);

    if (fadedOut && nextOpacity <= 0.02 && smokeParticles.length === 0) {
      runner.dataset.active = "false";
      window.cancelAnimationFrame(rafId);
      return;
    }
  };

  resize();
  onModelLoad();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  model.addEventListener("load", onModelLoad);
  rafId = window.requestAnimationFrame(tick);

  cleanupMotorcycleRide = () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    model.removeEventListener("load", onModelLoad);

    smokeCtx.clearRect(0, 0, width, height);
    smokeParticles = [];
    runner.dataset.active = "false";
    track.style.opacity = "0";
    track.dataset.motionBlur = "0";
    track.style.setProperty("--motorcycle-motion-blur", "0px");
    lastTrackX = Number.NaN;
    lastFrameTime = 0;
    triggerArmed = false;
    triggerReady = false;
    triggerReleaseAt = 0;
    parkedAtTime = 0;
  };
}
