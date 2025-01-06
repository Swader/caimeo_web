import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@^0.11.0";
import { build, stop } from "npm:esbuild@0.24.0";
import { copy } from "https://deno.land/std@0.210.0/fs/copy.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/ensure_dir.ts";
import { emptyDir } from "https://deno.land/std@0.210.0/fs/empty_dir.ts";

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
        }
    }).catch((e: Error) => {
        console.error('Build failed:', e);
        Deno.exit(1);
    });

    // Copy static files
    await copy("./src/index.html", "./dist/index.html");
    await copy("./src/what-is-caimeo.html", "./dist/what-is-caimeo.html");
    await copy("./src/styles.css", "./dist/styles.css");

    console.log('Build complete! Files written to ./dist');
    stop();
}

if (import.meta.main) {
    buildIt();
} 