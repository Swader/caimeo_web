/// <reference lib="deno.ns" />

import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";
import { build, stop } from "npm:esbuild@0.24.0";
import { copy } from "https://deno.land/std@0.210.0/fs/copy.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/ensure_dir.ts";
import { emptyDir } from "https://deno.land/std@0.210.0/fs/empty_dir.ts";
import { walk } from "https://deno.land/std@0.210.0/fs/walk.ts";

async function buildIt() {
    // Clean and ensure dist directory exists
    await emptyDir("./dist");

    // Build TypeScript
    await build({
        plugins: [...denoPlugins({})],
        entryPoints: ["./src/main.ts"],
        outfile: "./dist/main.js",
        bundle: true,
        minify: true,
        format: "esm",
        banner: { 
            js: `// @ts-nocheck\n// deno-lint-ignore-file`
        },
        external: ["npm:ethers@5.7.2"],
        platform: "browser"
    }).catch((e: Error) => {
        console.error('Build failed:', e);
        Deno.exit(1);
    });

    // Copy all HTML files
    for await (const entry of walk("./src", { exts: [".html"] })) {
        const targetPath = entry.path.replace(/^src\//, "dist/");
        await copy(entry.path, targetPath);
    }

    // Copy other static files
    await copy("./src/styles.css", "./dist/styles.css");
    await copy("./src/images", "./dist/images");

    console.log('Build complete! Files written to ./dist');
    stop();
}

if (import.meta.main) {
    buildIt();
} 