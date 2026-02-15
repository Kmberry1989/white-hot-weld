import { Mesh, Program, Renderer, Triangle } from "ogl";
import type { EffectPreset, ShaderConfig } from "../../types/effects";

const PRESET_MAP: Record<EffectPreset, ShaderConfig> = {
  home: { intensity: 1, speed: 0.26, grain: 0.1, pointerInfluence: 0.26 },
  gallery: { intensity: 0.85, speed: 0.22, grain: 0.09, pointerInfluence: 0.21 },
  work: { intensity: 0.75, speed: 0.2, grain: 0.08, pointerInfluence: 0.18 },
  inner: { intensity: 0.6, speed: 0.17, grain: 0.07, pointerInfluence: 0.15 }
};

let cleanupShader: (() => void) | null = null;

function shouldDisableShader(layer: HTMLElement, disabledFlag: boolean): boolean {
  if (disabledFlag) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (window.matchMedia("(pointer: coarse)").matches) return true;

  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.deviceMemory ?? 8) <= 4) return true;
  if ((navigator.hardwareConcurrency ?? 8) <= 4) return true;
  if (window.innerWidth < 780) return true;
  if (layer.clientWidth < 1 || layer.clientHeight < 1) return true;

  return false;
}

export function initForgeShader(layer: HTMLElement, preset: EffectPreset | string, disabledFlag = false): void {
  if (cleanupShader) {
    cleanupShader();
    cleanupShader = null;
  }

  if (shouldDisableShader(layer, disabledFlag)) {
    layer.dataset.active = "false";
    return;
  }

  const shaderConfig = PRESET_MAP[preset as EffectPreset] ?? PRESET_MAP.inner;

  let renderer: Renderer;
  try {
    renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5)
    });
  } catch {
    layer.dataset.active = "false";
    return;
  }

  const gl = renderer.gl;
  const canvas = gl.canvas;
  canvas.setAttribute("aria-hidden", "true");

  const targetCanvas = layer.querySelector("[data-forge-canvas]");
  if (targetCanvas) {
    targetCanvas.replaceWith(canvas);
  } else {
    layer.append(canvas);
  }

  const geometry = new Triangle(gl);

  const program = new Program(gl, {
    vertex: /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
    fragment: /* glsl */ `
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uIntensity;
      uniform float uSpeed;
      uniform float uGrain;
      uniform float uPointerInfluence;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
               (c - a) * u.y * (1.0 - u.x) +
               (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        uv.x *= aspect;

        vec2 pointer = uPointer;
        pointer.x *= aspect;

        float t = uTime * uSpeed;
        vec2 drift = vec2(sin(t * 0.8), cos(t * 0.55)) * 0.25;

        float steelWave = fbm(uv * 2.7 + drift);
        float emberBloom = 1.0 - smoothstep(0.0, 1.2, length((uv - pointer) * vec2(1.0, 1.25)));
        float flare = fbm(uv * 7.0 + t);

        vec3 steel = vec3(0.07, 0.09, 0.11);
        vec3 gunmetal = vec3(0.13, 0.16, 0.2);
        vec3 ember = vec3(0.85, 0.31, 0.16);
        vec3 electric = vec3(0.27, 0.53, 0.66);

        vec3 color = mix(steel, gunmetal, steelWave * 0.85);
        color += ember * emberBloom * uIntensity * (0.25 + flare * 0.4);
        color += electric * smoothstep(0.45, 1.0, steelWave) * 0.12;

        float grain = (hash(gl_FragCoord.xy + uTime * 70.0) - 0.5) * uGrain;
        color += grain;

        gl_FragColor = vec4(color, 0.92);
      }
    `,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uPointer: { value: [0.5, 0.5] },
      uIntensity: { value: shaderConfig.intensity },
      uSpeed: { value: shaderConfig.speed },
      uGrain: { value: shaderConfig.grain },
      uPointerInfluence: { value: shaderConfig.pointerInfluence }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize(): void {
    renderer.setSize(layer.clientWidth, layer.clientHeight);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  }

  const onPointerMove = (event: PointerEvent): void => {
    const x = event.clientX / Math.max(window.innerWidth, 1);
    const y = 1 - event.clientY / Math.max(window.innerHeight, 1);
    pointer.tx = x;
    pointer.ty = y;
  };

  let rafId = 0;
  let isPaused = document.hidden;

  const onVisibility = (): void => {
    isPaused = document.hidden;
  };

  const start = performance.now();
  const tick = (now: number): void => {
    rafId = window.requestAnimationFrame(tick);

    if (isPaused) {
      return;
    }

    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    program.uniforms.uTime.value = (now - start) / 1000;

    const wobbleX = (pointer.x - 0.5) * shaderConfig.pointerInfluence;
    const wobbleY = (pointer.y - 0.5) * shaderConfig.pointerInfluence;
    program.uniforms.uPointer.value = [0.5 + wobbleX, 0.5 + wobbleY];

    renderer.render({ scene: mesh });
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  rafId = window.requestAnimationFrame(tick);
  layer.dataset.active = "true";

  cleanupShader = () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.remove();
    layer.dataset.active = "false";
  };
}
