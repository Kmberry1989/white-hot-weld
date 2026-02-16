import type { EffectPreset } from "../../types/effects";

interface ArcPoint {
  x: number;
  y: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

interface InteractionSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

interface ArcFlashEvent {
  start: number;
  duration: number;
  points: ArcPoint[];
  sparks: Spark[];
}

interface ArcPreset {
  minIntervalMs: number;
  maxIntervalMs: number;
  maxOpacity: number;
  sparkCount: number;
}

const ARC_PRESETS: Record<EffectPreset, ArcPreset> = {
  home: { minIntervalMs: 1800, maxIntervalMs: 4000, maxOpacity: 0.92, sparkCount: 46 },
  gallery: { minIntervalMs: 3200, maxIntervalMs: 6600, maxOpacity: 0.72, sparkCount: 30 },
  work: { minIntervalMs: 3600, maxIntervalMs: 7600, maxOpacity: 0.66, sparkCount: 26 },
  inner: { minIntervalMs: 4200, maxIntervalMs: 8600, maxOpacity: 0.58, sparkCount: 22 }
};

let cleanupArcFlash: (() => void) | null = null;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shouldDisableArcFlash(layer: HTMLElement, disabledFlag: boolean): boolean {
  if (disabledFlag) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (window.innerWidth < 760) return true;
  if (layer.clientWidth < 1 || layer.clientHeight < 1) return true;
  return false;
}

function buildArcPoints(width: number, height: number): ArcPoint[] {
  const startEdgeLeft = Math.random() > 0.5;
  const startX = startEdgeLeft ? randomBetween(-0.02, 0.08) * width : randomBetween(0.92, 1.02) * width;
  const endX = startEdgeLeft ? randomBetween(0.52, 0.88) * width : randomBetween(0.12, 0.48) * width;

  const startY = randomBetween(0.2, 0.58) * height;
  const endY = startY + randomBetween(-0.22, 0.18) * height;

  const segmentCount = 8;
  const points: ArcPoint[] = [];

  for (let i = 0; i <= segmentCount; i += 1) {
    const t = i / segmentCount;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t + randomBetween(-0.05, 0.05) * height;
    points.push({ x, y });
  }

  return points;
}

function buildSparks(points: ArcPoint[], count: number): Spark[] {
  if (points.length === 0) return [];

  const pivot = points[Math.floor(points.length * randomBetween(0.35, 0.85))];
  const sparks: Spark[] = [];

  for (let i = 0; i < count; i += 1) {
    const angle = randomBetween(-Math.PI * 0.75, Math.PI * 0.75);
    const speed = randomBetween(0.7, 2.9);

    sparks.push({
      x: pivot.x + randomBetween(-8, 8),
      y: pivot.y + randomBetween(-6, 6),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - randomBetween(0.25, 1.25),
      life: randomBetween(0.22, 0.66),
      size: randomBetween(0.8, 2.2)
    });
  }

  return sparks;
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  points: ArcPoint[],
  alpha: number,
  jitterAmplitude = 3
): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.shadowBlur = 22;
  ctx.shadowColor = `rgba(107, 186, 255, ${Math.min(alpha * 1.3, 1)})`;

  ctx.beginPath();
  points.forEach((point, idx) => {
    const jx = randomBetween(-jitterAmplitude, jitterAmplitude);
    const jy = randomBetween(-jitterAmplitude, jitterAmplitude);

    if (idx === 0) {
      ctx.moveTo(point.x + jx, point.y + jy);
      return;
    }

    ctx.lineTo(point.x + jx, point.y + jy);
  });

  ctx.strokeStyle = `rgba(118, 207, 255, ${alpha})`;
  ctx.lineWidth = randomBetween(1.1, 2.6);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(alpha * 0.9, 1)})`;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();
}

function drawSparks(
  ctx: CanvasRenderingContext2D,
  sparks: Spark[],
  dtSeconds: number,
  alphaMultiplier: number
): Spark[] {
  const next: Spark[] = [];

  for (const spark of sparks) {
    spark.life -= dtSeconds;
    if (spark.life <= 0) continue;

    spark.x += spark.vx * dtSeconds * 60;
    spark.y += spark.vy * dtSeconds * 60;
    spark.vy += 0.03 * dtSeconds * 60;

    const alpha = Math.max(0, Math.min(1, spark.life * 2.1 * alphaMultiplier));
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 182, 97, ${alpha})`;
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fill();

    next.push(spark);
  }

  return next;
}

function drawArcBloom(
  ctx: CanvasRenderingContext2D,
  points: ArcPoint[],
  alpha: number,
  width: number,
  height: number
): void {
  if (points.length === 0 || alpha <= 0) return;

  const pivot = points[Math.floor(points.length * randomBetween(0.45, 0.78))];
  const radius = Math.max(70, Math.min(width, height) * randomBetween(0.12, 0.2));

  const gradient = ctx.createRadialGradient(pivot.x, pivot.y, 0, pivot.x, pivot.y, radius);
  gradient.addColorStop(0, `rgba(255, 247, 238, ${alpha * 0.46})`);
  gradient.addColorStop(0.35, `rgba(255, 199, 146, ${alpha * 0.22})`);
  gradient.addColorStop(1, "rgba(255, 148, 90, 0)");

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawInteractionSparks(
  ctx: CanvasRenderingContext2D,
  sparks: InteractionSpark[],
  dtSeconds: number
): InteractionSpark[] {
  const next: InteractionSpark[] = [];

  for (const spark of sparks) {
    spark.life -= dtSeconds;
    if (spark.life <= 0) {
      continue;
    }

    spark.x += spark.vx * dtSeconds * 60;
    spark.y += spark.vy * dtSeconds * 60;
    spark.vx *= 0.985;
    spark.vy *= 0.985;
    spark.vy += 0.02 * dtSeconds * 60;

    const lifeRatio = spark.life / Math.max(spark.maxLife, 0.01);
    const alpha = spark.alpha * lifeRatio;
    const tailX = spark.x - spark.vx * 0.85;
    const tailY = spark.y - spark.vy * 0.85;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `rgba(255, 246, 234, ${alpha * 0.35})`;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(spark.x, spark.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 236, 208, ${alpha})`;
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    next.push(spark);
  }

  return next;
}

export function initArcFlash(layer: HTMLElement, preset: EffectPreset | string, disabledFlag = false): void {
  if (cleanupArcFlash) {
    cleanupArcFlash();
    cleanupArcFlash = null;
  }

  if (shouldDisableArcFlash(layer, disabledFlag)) {
    return;
  }

  const selectedPreset = ARC_PRESETS[preset as EffectPreset] ?? ARC_PRESETS.inner;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  const overlay = layer.querySelector<HTMLCanvasElement>("[data-arc-canvas]") ?? document.createElement("canvas");
  overlay.className = "arc-flash-canvas";
  overlay.dataset.arcCanvas = "true";

  if (!overlay.parentElement) {
    layer.append(overlay);
  }

  const ctx = overlay.getContext("2d", { alpha: true });
  if (!ctx) {
    return;
  }

  let width = 1;
  let height = 1;
  let activeEvent: ArcFlashEvent | null = null;
  let interactionSparks: InteractionSpark[] = [];
  let nextEventAt = performance.now() + randomBetween(selectedPreset.minIntervalMs, selectedPreset.maxIntervalMs);
  let rafId = 0;
  let lastTime = performance.now();
  let hidden = document.hidden;
  let lastPointerX = -1000;
  let lastPointerY = -1000;
  let lastPointerTime = 0;

  const resize = (): void => {
    width = Math.max(1, layer.clientWidth);
    height = Math.max(1, layer.clientHeight);
    overlay.width = Math.floor(width * dpr);
    overlay.height = Math.floor(height * dpr);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const createEvent = (now: number): ArcFlashEvent => {
    const points = buildArcPoints(width, height);
    return {
      start: now,
      duration: randomBetween(180, 360),
      points,
      sparks: buildSparks(points, selectedPreset.sparkCount)
    };
  };

  const onVisibility = (): void => {
    hidden = document.hidden;
  };

  const spawnInteractionBurst = (x: number, y: number, count: number, spread = 1): void => {
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(-Math.PI, Math.PI);
      const speed = randomBetween(0.25, 1.3) * spread;
      const life = randomBetween(0.2, 0.65);

      interactionSparks.push({
        x: x + randomBetween(-4, 4),
        y: y + randomBetween(-4, 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(0.12, 0.38),
        life,
        maxLife: life,
        size: randomBetween(0.45, 1.3),
        alpha: randomBetween(0.16, 0.34)
      });
    }

    if (interactionSparks.length > 260) {
      interactionSparks = interactionSparks.slice(interactionSparks.length - 240);
    }
  };

  const toLayerCoords = (event: PointerEvent): { x: number; y: number } => {
    const rect = layer.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const onPointerMove = (event: PointerEvent): void => {
    const now = performance.now();
    const { x, y } = toLayerCoords(event);
    const dx = x - lastPointerX;
    const dy = y - lastPointerY;
    const distance = Math.hypot(dx, dy);

    if (distance > 12 || now - lastPointerTime > 72) {
      spawnInteractionBurst(x, y, 2, 0.85);
      lastPointerX = x;
      lastPointerY = y;
      lastPointerTime = now;
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    const { x, y } = toLayerCoords(event);
    spawnInteractionBurst(x, y, 10, 1.5);
    lastPointerX = x;
    lastPointerY = y;
    lastPointerTime = performance.now();
  };

  const tick = (now: number): void => {
    rafId = window.requestAnimationFrame(tick);

    const dtSeconds = Math.min((now - lastTime) / 1000, 0.06);
    lastTime = now;

    if (hidden) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    interactionSparks = drawInteractionSparks(ctx, interactionSparks, dtSeconds);

    if (!activeEvent && now >= nextEventAt) {
      activeEvent = createEvent(now);
    }

    if (!activeEvent) {
      return;
    }

    const progress = (now - activeEvent.start) / activeEvent.duration;
    const flashEnvelope = progress < 0.4 ? progress / 0.4 : (1 - progress) / 0.6;
    const flashAlpha = Math.max(0, Math.min(1, flashEnvelope)) * selectedPreset.maxOpacity;

    if (flashAlpha > 0) {
      drawArc(ctx, activeEvent.points, flashAlpha, 4.2);
      drawArcBloom(ctx, activeEvent.points, flashAlpha, width, height);

      if (Math.random() > 0.48) {
        drawArc(ctx, activeEvent.points, flashAlpha * 0.6, 7.4);
      }
    }

    activeEvent.sparks = drawSparks(ctx, activeEvent.sparks, dtSeconds, flashAlpha + 0.35);

    if (progress >= 1 && activeEvent.sparks.length === 0) {
      activeEvent = null;
      nextEventAt = now + randomBetween(selectedPreset.minIntervalMs, selectedPreset.maxIntervalMs);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  rafId = window.requestAnimationFrame(tick);

  cleanupArcFlash = () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("visibilitychange", onVisibility);
    ctx.clearRect(0, 0, width, height);
    interactionSparks = [];
  };
}
