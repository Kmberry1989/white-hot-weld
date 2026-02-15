export type MediaTier = "primary" | "editorial" | "thumb" | "archive";

export type MediaCategory = "work" | "people" | "process" | "display" | "other";

export interface MediaManifestEntry {
  id: string;
  sourcePath: string;
  destPath: string;
  width: number;
  height: number;
  tier: MediaTier;
  category: MediaCategory;
  recommendedUse: string;
  duplicateGroupId?: string;
  hash: string;
}
