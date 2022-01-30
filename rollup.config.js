import svelte from "rollup-plugin-svelte";
import css from "rollup-plugin-css-only";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import sass from "rollup-plugin-sass";
import clear from "rollup-plugin-clear";
import { join } from "path";
import { unlink } from "fs/promises";
import { minify } from "csso";
import copy from "rollup-plugin-copy";
import purgecss from "purgecss";

const PROD = process.env.ROLLUP_WATCH !== "true";

const targetFolder = join(".", "public");
const copyHTML = () => copy({
    targets: [
        { src: "src/index.html", dest: targetFolder }
    ]
});

export default [
    {
        input: "src/main.js",
        output: {
            format: "iife",
            name: "app",
            file: join(targetFolder, "app.js"),
            compact: true,
        },
        plugins: [
            svelte({
                compilerOptions: {
                    dev: !PROD
                },
                emitCss: true,
                extensions: [".html"],
                //include: "src/**/*.html"
            }),
            css({
                output: "bundle.css",
            }),
            resolve({ dedupe: () => true }),
            commonjs(),
            PROD && terser(),
            clear({
                targets: [targetFolder],
            }),
            copyHTML()
        ]
    }, {
        input: "src/sass/site.scss",
        output: {
            file: join(targetFolder, "tmp2.css")
        },
        plugins: [
            sass({
                output: join(targetFolder, "main.css"),
                exclude: [],
                include: ["**/*.scss", "**/*.css"],
                options: PROD ? { outputStyle: "compressed" } : {},
                processor: async css => {
                    if (PROD) {
                        css = minify(css).css;
                        let purged = await new purgecss().purge({
                            content: ["src/**/*.html"],
                            css: [{ raw: css }]
                        });
                        if (purged.length) {
                            css = purged[0].css;
                        }
                    }
                    return css;
                }

            }),
            {
                name: "del",
                async writeBundle(options) {
                    await unlink(options.file);
                }
            },
            copyHTML()
        ]
    }
]