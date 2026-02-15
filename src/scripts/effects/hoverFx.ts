import { animate } from "motion";
import type { HoverConfig } from "../../types/effects";

const HOVER_CONFIG: HoverConfig = {
  tiltMaxDeg: 8,
  scaleMax: 1.02,
  glowStrength: 0.55
};

let cleanupFns: Array<() => void> = [];

function clearBindings(): void {
  for (const fn of cleanupFns) fn();
  cleanupFns = [];
}

function setupHoverCards(config: HoverConfig): void {
  const cards = document.querySelectorAll<HTMLElement>("[data-hover-card]");

  cards.forEach((card) => {
    const onMove = (event: PointerEvent): void => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / Math.max(rect.width, 1);
      const py = (event.clientY - rect.top) / Math.max(rect.height, 1);
      const ry = (px - 0.5) * config.tiltMaxDeg * 2;
      const rx = (0.5 - py) * config.tiltMaxDeg * 2;

      card.style.setProperty("--hover-rx", `${rx.toFixed(2)}deg`);
      card.style.setProperty("--hover-ry", `${ry.toFixed(2)}deg`);
      card.style.setProperty("--hover-scale", `${config.scaleMax}`);
      card.style.setProperty("--hover-glow", `${config.glowStrength}`);
    };

    const onLeave = (): void => {
      card.style.setProperty("--hover-rx", "0deg");
      card.style.setProperty("--hover-ry", "0deg");
      card.style.setProperty("--hover-scale", "1");
      card.style.setProperty("--hover-glow", "0");
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);

    cleanupFns.push(() => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      onLeave();
    });
  });
}

function setupMagneticCtas(): void {
  const ctas = document.querySelectorAll<HTMLElement>("[data-magnetic]");

  ctas.forEach((cta) => {
    const onMove = (event: PointerEvent): void => {
      const rect = cta.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      cta.style.setProperty("--mx", `${(x * 0.14).toFixed(1)}px`);
      cta.style.setProperty("--my", `${(y * 0.2).toFixed(1)}px`);
    };

    const onEnter = (): void => {
      animate(cta, { boxShadow: ["0 0 0 rgba(224,101,47,0)", "0 10px 28px rgba(224,101,47,0.28)"] }, { duration: 0.35 });
    };

    const onLeave = (): void => {
      cta.style.setProperty("--mx", "0px");
      cta.style.setProperty("--my", "0px");
      animate(cta, { boxShadow: ["0 10px 28px rgba(224,101,47,0.28)", "0 0 0 rgba(224,101,47,0)"] }, { duration: 0.4 });
    };

    cta.addEventListener("pointermove", onMove);
    cta.addEventListener("pointerenter", onEnter);
    cta.addEventListener("pointerleave", onLeave);

    cleanupFns.push(() => {
      cta.removeEventListener("pointermove", onMove);
      cta.removeEventListener("pointerenter", onEnter);
      cta.removeEventListener("pointerleave", onLeave);
      onLeave();
    });
  });
}

function setupNavGlow(): void {
  const links = document.querySelectorAll<HTMLElement>("[data-nav-link]");

  links.forEach((link) => {
    const onEnter = (): void => {
      link.dataset.navGlow = "on";
      animate(link, { transform: ["translateY(0px)", "translateY(-1px)"] }, { duration: 0.25 });
    };

    const onLeave = (): void => {
      link.dataset.navGlow = "off";
      animate(link, { transform: ["translateY(-1px)", "translateY(0px)"] }, { duration: 0.25 });
    };

    link.addEventListener("pointerenter", onEnter);
    link.addEventListener("pointerleave", onLeave);

    cleanupFns.push(() => {
      link.removeEventListener("pointerenter", onEnter);
      link.removeEventListener("pointerleave", onLeave);
      link.dataset.navGlow = "off";
    });
  });
}

export function initHoverFx(): void {
  clearBindings();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  if (window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  setupHoverCards(HOVER_CONFIG);
  setupMagneticCtas();
  setupNavGlow();
}
