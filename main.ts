// The World Today — Friday 27 November 2026.
// A broadsheet courier: it carries the finished poster for this day's
// news (entry.png, drawn by render.py in the build session) into the
// output directory make.fun grades. The image is the entry; this file
// only moves it, and moves it exactly.
//
// Edition manifest — the stories the poster sums up:
//   LEAD   The Gulf war widens: Iranian drones kill two Italians in
//          Kuwait; three tankers ablaze in Hormuz; Brent nears $97.
//   US     Thanksgiving storm: 400 flights cancelled, 724,000 homes dark.
//   UKRAINE Zelensky warns of a new Russian mass strike on Kyiv.
//   N.KOREA Kim vows to expand the nuclear arsenal.
//   COLOMBIA Supermarket siege ends; all hostages freed after 16 hours.
//   INDIA  Delhi police bust a cyber-slavery ring; 164 rescued.
//   SPORT  India strike early in Christchurch; Gukesh draws game three.
import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EDITION_DATE = "Friday 27 November 2026";
const LEAD_HEADLINE = "Drones kill two Italians in Kuwait; tankers ablaze in Hormuz";
const IMAGE_NAME = "entry.png";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = join(HERE, IMAGE_NAME);

function outputDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  return dir;
}

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}


function loadPoster(): Buffer {
  const bytes = readFileSync(SOURCE_PATH);
  if (bytes.length < PNG_SIGNATURE.length) {
    throw new Error(`${IMAGE_NAME} is too short to be a PNG (${bytes.length} bytes)`);
  }
  if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(`${IMAGE_NAME} does not start with a PNG signature`);
  }
  if (bytes.length > 1048576) {
    throw new Error(`${IMAGE_NAME} is ${bytes.length} bytes, over the 1 MiB cap`);
  }
  return bytes;
}

function deliver(bytes: Buffer, dir: string): string {
  const target = join(dir, IMAGE_NAME);
  const staging = join(dir, `${IMAGE_NAME}.staging-${process.pid}`);
  copyFileSync(SOURCE_PATH, staging);
  renameSync(staging, target);
  const delivered = readFileSync(target);
  if (delivered.length !== bytes.length || sha256Hex(delivered) !== sha256Hex(bytes)) {
    throw new Error("delivered file differs from the bundled poster");
  }
  return target;
}


function main(): void {
  const poster = loadPoster();
  const dir = outputDir();
  let target: string;
  try {
    target = deliver(poster, dir);
  } catch (err) {
    rmSync(join(dir, `${IMAGE_NAME}.staging-${process.pid}`), { force: true });
    throw err;
  }
  console.log(`The World Today — ${EDITION_DATE}`);
  console.log(`Lead: ${LEAD_HEADLINE}`);
  console.log(`Delivered ${target} (${poster.length} bytes, sha256 ${sha256Hex(poster)})`);
}

main();
