export type EffectPreset = "home" | "gallery" | "work" | "inner";

export interface ShaderConfig {
  intensity: number;
  speed: number;
  grain: number;
  pointerInfluence: number;
}

export interface HoverConfig {
  tiltMaxDeg: number;
  scaleMax: number;
  glowStrength: number;
}
