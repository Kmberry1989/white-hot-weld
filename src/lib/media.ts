import { readFile } from "node:fs/promises";
import type { MediaCategory, MediaManifestEntry } from "../types/media";

const manifestFile = new URL("../content/media/manifest.json", import.meta.url);
let manifestCache: MediaManifestEntry[] | null = null;

async function readManifest(): Promise<MediaManifestEntry[]> {
  if (manifestCache) {
    return manifestCache;
  }

  try {
    const raw = await readFile(manifestFile, "utf8");
    manifestCache = JSON.parse(raw) as MediaManifestEntry[];
  } catch {
    manifestCache = [];
  }

  return manifestCache;
}

export async function getPrimaryMedia(): Promise<MediaManifestEntry[]> {
  const entries = await readManifest();

  return entries.filter((entry) => entry.tier === "primary");
}

export async function getThumbMedia(limit = 24): Promise<MediaManifestEntry[]> {
  const entries = await readManifest();

  return entries.filter((entry) => entry.tier === "thumb").slice(0, limit);
}

export async function getMediaByCategory(category: MediaCategory): Promise<MediaManifestEntry[]> {
  const entries = await readManifest();

  return entries.filter((entry) => entry.category === category);
}

export async function getMediaByUse(use: string): Promise<MediaManifestEntry[]> {
  const entries = await readManifest();

  return entries.filter((entry) => entry.recommendedUse === use);
}
