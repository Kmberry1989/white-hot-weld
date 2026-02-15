import Lenis from "@studio-freight/lenis";
import { animate } from "motion";

let lenis: Lenis | null = null;
let lenisRafId = 0;

function stopLenis(): void {
  if (lenisRafId) {
    cancelAnimationFrame(lenisRafId);
    lenisRafId = 0;
  }

  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

function startLenis(): void {
  const canUseLenis =
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.innerWidth >= 900;

  if (!canUseLenis) {
    stopLenis();
    return;
  }

  if (lenis) {
    return;
  }

  lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    wheelMultiplier: 0.86,
    touchMultiplier: 1
  });

  const tick = (time: number): void => {
    lenis?.raf(time);
    lenisRafId = requestAnimationFrame(tick);
  };

  lenisRafId = requestAnimationFrame(tick);
}

function animatePageEntrance(): void {
  const main = document.querySelector<HTMLElement>("main");
  if (main) {
    animate(
      main as unknown as Element,
      {
        opacity: [0.88, 1],
        y: [12, 0]
      } as any,
      {
        duration: 0.55,
        easing: "cubic-bezier(.22,.61,.36,1)"
      } as any
    );
  }

  const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  revealTargets.forEach((node, index) => {
    animate(
      node as unknown as Element,
      {
        opacity: [0, 1],
        y: [24, 0]
      } as any,
      {
        duration: 0.72,
        delay: 0.08 + index * 0.06,
        easing: "cubic-bezier(.22,1,.36,1)"
      } as any
    );
  });
}

export function initPageMotion(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stopLenis();
    return;
  }

  startLenis();
  animatePageEntrance();
}
