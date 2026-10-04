import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/**
 * Recursively collects every file below `dir`, returning paths relative to `dir`.
 * @param {string} dir - Absolute directory to walk.
 * @param {string} base - Root the returned paths are relative to (defaults to `dir`).
 * @returns {string[]} Relative file paths (using the platform separator).
 */
function collectFiles(dir: string, base: string = dir): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? collectFiles(full, base) : [relative(base, full)];
    });
}

/**
 * Vite plugin that ships the repository's static `assets/` tree with the build.
 *
 * Files under `assets/` that are referenced by stable (non-hashed) URLs - such
 * as the OpenGraph/logo images in `index.html` - are copied verbatim into
 * `<outDir>/assets/**`, so URLs like `<base>/assets/logos/png/...` keep
 * working after deployment.
 *
 * Fonts live in `assets/fonts` and are already emitted (hashed) by the CSS
 * `url()` pipeline, so they are skipped here to avoid shipping them twice.
 * @returns {Plugin} The Vite plugin definition.
 */
function includeStaticAssets(): Plugin {
    const skippedTopLevelDirs = new Set(["fonts"]);
    let assetsDir = "";

    return {
        name: "almaweb:include-static-assets",
        apply: "build",
        configResolved(config) {
            assetsDir = resolve(config.root, "assets");
        },
        buildStart() {
            collectFiles(assetsDir).forEach((rel) => {
                const [top] = rel.split(sep);
                if (top !== undefined && skippedTopLevelDirs.has(top)) return;
                this.emitFile({
                    type: "asset",
                    fileName: `assets/${rel.split(sep).join("/")}`,
                    source: readFileSync(join(assetsDir, rel)),
                });
            });
        },
    };
}

export default defineConfig({
    plugins: [tailwindcss(), includeStaticAssets()].filter((plugin) => plugin !== null),
    appType: "spa",
    base: process.env.BASE_PATH ?? "/almaweb/",
    build: {
        outDir: "dist",
        target: "es2022",
        sourcemap: false,
    },
});
