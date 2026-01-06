import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir, readdir, rm } from "node:fs/promises";

export type BuildOptions = {
  minify?: boolean;
};

const WEBSITE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(WEBSITE_DIR, "src");
const DIST_DIR = path.join(WEBSITE_DIR, "dist");

async function emptyDir(dir: string) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function copyDirFiltered(
  srcDir: string,
  destDir: string,
  shouldCopy: (relativePathFromSrcRoot: string) => boolean,
) {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirFiltered(srcPath, destPath, shouldCopy);
        return;
      }

      const relativePathFromSrcRoot = path.relative(SRC_DIR, srcPath);
      if (!shouldCopy(relativePathFromSrcRoot)) return;

      await mkdir(path.dirname(destPath), { recursive: true });
      await copyFile(srcPath, destPath);
    }),
  );
}

export async function buildSite(options: BuildOptions = {}) {
  const minify = options.minify ?? true;

  // Clean and ensure dist directory exists
  await emptyDir(DIST_DIR);

  // Bundle TypeScript for the browser (no external deps)
  const result = await Bun.build({
    entrypoints: [path.join(SRC_DIR, "main.ts")],
    outdir: DIST_DIR,
    target: "browser",
    minify,
  });

  if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) console.error(log);
    process.exitCode = 1;
    return;
  }

  // Copy all non-TS static assets from src → dist (html/css/images/pdf/js/etc)
  await copyDirFiltered(SRC_DIR, DIST_DIR, (relativePath) => {
    return !relativePath.endsWith(".ts");
  });

  console.log(`Build complete! Files written to ${DIST_DIR}`);
}

if (import.meta.main) {
  await buildSite();
}