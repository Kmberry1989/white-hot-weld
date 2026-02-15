#!/usr/bin/env node
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const unsortedDir = path.join(root, "public", "images", "unsorted");
const manifestPath = path.join(root, "src", "content", "media", "manifest.json");

const writeMode = process.argv.includes("--write");

const CATEGORY_OVERRIDES = {
  "31895193_2055532891367481_4177454345081585664_n.jpg": "display",
  "32089849_2058887031032067_6651876908017385472_n.jpg": "work",
  "32151515_2058887071032063_8720147855701966848_n.jpg": "work",
  "593718105_1169768845264331_3444936837179247741_n.jpg": "people",
  "323344103_5963035910446148_578464298566660753_n.jpg": "process",
  "500078732_4005670289687055_3897546586975845562_n.jpg": "process"
};

/** @typedef {"primary"|"editorial"|"thumb"|"archive"} MediaTier */
/** @typedef {"work"|"people"|"process"|"display"|"other"} MediaCategory */

/**
 * @param {Buffer} buffer
 * @returns {{ width: number; height: number }}
 */
function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return { width: 0, height: 0 };
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 1 >= buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      break;
    }

    const isSofMarker =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isSofMarker) {
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return { width, height };
    }

    offset += segmentLength;
  }

  return { width: 0, height: 0 };
}

/**
 * @param {string} fileName
 * @returns {string}
 */
function normalizeDuplicateName(fileName) {
  return fileName.replace(/\s*\(\d+\)(?=\.[^.]+$)/, "");
}

/**
 * @param {string} fileName
 * @returns {string}
 */
function slugify(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * @param {string} fileName
 * @param {MediaTier} tier
 * @param {MediaCategory} category
 * @param {"name-duplicate"|"hash-duplicate"|"lowres"|""} reason
 * @returns {string}
 */
function recommendedUseFor(fileName, tier, category, reason) {
  if (tier === "archive" && reason === "name-duplicate") return "archive-name-duplicate";
  if (tier === "archive" && reason === "hash-duplicate") return "archive-hash-duplicate";
  if (tier === "archive" && reason === "lowres") return "archive-lowres";
  if (tier === "editorial") return "about-process-inline";
  if (tier === "thumb") return "gallery-thumb-mosaic";

  if (tier === "primary" && category === "display") return "home-hero-support";
  if (tier === "primary" && category === "people") return "about-people-feature";
  if (tier === "primary") return "featured-work-lead";

  return `library-${fileName}`;
}

/**
 * @param {MediaTier} tier
 * @param {"name-duplicate"|"hash-duplicate"|"lowres"|""} reason
 * @returns {string[]}
 */
function destinationSegments(tier, reason) {
  if (tier === "primary") return ["primary"];
  if (tier === "editorial") return ["editorial"];
  if (tier === "thumb") return ["thumb"];
  if (reason === "name-duplicate" || reason === "hash-duplicate") return ["archive", "duplicates"];
  return ["archive", "lowres"];
}

/**
 * @param {string} from
 * @param {string} to
 */
async function moveFile(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  try {
    await fs.rename(from, to);
  } catch {
    await fs.copyFile(from, to);
    await fs.unlink(from);
  }
}

async function main() {
  const unsortedEntries = await fs
    .readdir(unsortedDir, { withFileTypes: true })
    .catch(() => /** @type {import("node:fs").Dirent[]} */ ([]));

  const imageFiles = unsortedEntries
    .filter((entry) => entry.isFile() && /\.(jpe?g)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (imageFiles.length === 0) {
    const existingManifest = await fs.readFile(manifestPath, "utf8").catch(() => "");
    if (!existingManifest) {
      console.log("No unsorted images found and no existing manifest.");
      return;
    }

    const manifest = JSON.parse(existingManifest);
    const byTier = manifest.reduce((acc, item) => {
      acc[item.tier] = (acc[item.tier] ?? 0) + 1;
      return acc;
    }, {});
    console.log("Unsorted folder is empty. Existing manifest summary:");
    console.log(byTier);
    return;
  }

  const fileRecords = [];
  for (const fileName of imageFiles) {
    const absPath = path.join(unsortedDir, fileName);
    const buffer = await fs.readFile(absPath);
    const { width, height } = readJpegDimensions(buffer);
    const hash = createHash("md5").update(buffer).digest("hex");

    fileRecords.push({
      fileName,
      absPath,
      bytes: buffer.length,
      width,
      height,
      longEdge: Math.max(width, height),
      hash,
      normalizedName: normalizeDuplicateName(fileName),
      duplicateReason: "",
      duplicateGroupId: ""
    });
  }

  /** @type {Map<string, typeof fileRecords>} */
  const nameGroups = new Map();
  for (const record of fileRecords) {
    const list = nameGroups.get(record.normalizedName) ?? [];
    list.push(record);
    nameGroups.set(record.normalizedName, list);
  }

  for (const [key, group] of nameGroups.entries()) {
    if (group.length <= 1) continue;
    group.sort((a, b) => b.bytes - a.bytes || a.fileName.localeCompare(b.fileName));
    for (const duplicate of group.slice(1)) {
      duplicate.duplicateReason = "name-duplicate";
      duplicate.duplicateGroupId = `name:${slugify(key)}`;
    }
  }

  /** @type {Map<string, typeof fileRecords>} */
  const hashGroups = new Map();
  for (const record of fileRecords.filter((item) => !item.duplicateReason)) {
    const list = hashGroups.get(record.hash) ?? [];
    list.push(record);
    hashGroups.set(record.hash, list);
  }

  for (const [hash, group] of hashGroups.entries()) {
    if (group.length <= 1) continue;
    group.sort((a, b) => b.bytes - a.bytes || a.fileName.localeCompare(b.fileName));
    for (const duplicate of group.slice(1)) {
      duplicate.duplicateReason = "hash-duplicate";
      duplicate.duplicateGroupId = `hash:${hash.slice(0, 12)}`;
    }
  }

  const usedDestNames = new Set();
  const manifest = [];

  for (const record of fileRecords) {
    /** @type {MediaTier} */
    let tier = "thumb";

    if (record.duplicateReason === "name-duplicate" || record.duplicateReason === "hash-duplicate") {
      tier = "archive";
    } else if (record.longEdge >= 1200) {
      tier = "primary";
    } else if (record.longEdge >= 700) {
      tier = "editorial";
    } else if (record.longEdge < 360 || record.bytes < 12000) {
      tier = "archive";
      record.duplicateReason = "lowres";
    } else {
      tier = "thumb";
    }

    /** @type {MediaCategory} */
    const category = /** @type {MediaCategory} */ (
      CATEGORY_OVERRIDES[record.normalizedName] ?? (tier === "thumb" ? "other" : "work")
    );

    const subdir = destinationSegments(tier, record.duplicateReason);
    const baseSlug = slugify(record.normalizedName || record.fileName);

    let destFileName = `${baseSlug}-${record.hash.slice(0, 8)}.jpg`;
    if (usedDestNames.has(destFileName)) {
      let bump = 2;
      while (usedDestNames.has(`${baseSlug}-${record.hash.slice(0, 8)}-${bump}.jpg`)) bump += 1;
      destFileName = `${baseSlug}-${record.hash.slice(0, 8)}-${bump}.jpg`;
    }
    usedDestNames.add(destFileName);

    const destPath = path.posix.join("/images/library", ...subdir, destFileName);
    const id = `${baseSlug}-${record.hash.slice(0, 8)}`;

    manifest.push({
      id,
      sourcePath: path.posix.join("/images/unsorted", record.fileName),
      destPath,
      width: record.width,
      height: record.height,
      tier,
      category,
      recommendedUse: recommendedUseFor(record.fileName, tier, category, record.duplicateReason),
      duplicateGroupId: record.duplicateGroupId || undefined,
      hash: record.hash
    });

    if (writeMode) {
      const outputAbsPath = path.join(root, "public", destPath.replace(/^\/images\//, "images/"));
      await moveFile(record.absPath, outputAbsPath);
    }
  }

  const tierOrder = { primary: 0, editorial: 1, thumb: 2, archive: 3 };
  manifest.sort((a, b) => {
    const tierDelta = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDelta !== 0) return tierDelta;
    return a.destPath.localeCompare(b.destPath);
  });

  const summary = manifest.reduce((acc, item) => {
    acc[item.tier] = (acc[item.tier] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Mode: ${writeMode ? "WRITE" : "AUDIT"}`);
  console.log(`Total files considered: ${manifest.length}`);
  console.log("Tier summary:", summary);
  console.log(
    "Duplicate summary:",
    manifest.filter((item) => item.duplicateGroupId).length,
    "files assigned to duplicate groups"
  );

  if (writeMode) {
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Manifest written to ${manifestPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
