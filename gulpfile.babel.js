// @ts-check

import gulp from "gulp";
import { deleteAsync } from "del";
import pug from "gulp-pug";
import csso from "gulp-csso";
import autoprefixer from "gulp-autoprefixer";
import gulpImage from "gulp-image";
import webserver from "gulp-webserver";
import ghPages from "gulp-gh-pages";
import gulpSass from "gulp-sass";
import sass from "sass";
import typescript from "gulp-typescript";
import nodemon from "gulp-nodemon";

// Compiler
const scss = gulpSass(sass);
const tsProject = typescript.createProject("tsconfig.json");
const { include: tsInclude, compilerOptions: tsOptions } = tsProject.config;

// Stream routes
const routes = {
    deploy: "build/**/*",
    run: "build/",
    delete: ["build/, .poblish/"],
    ts: {
        watch: "src/**/*.ts",
        src: () => {
            if (typeof tsInclude === "undefined") return "src/**/*.ts";
            console.log(tsInclude.join(" "));
            return tsInclude.join(" ");
        },
        dest: tsOptions.outDir,
    },
    img: {
        watch: "src/img/**/*.{png, jpg}",
        src: "src/img/**/*.{png,jpg}",
        dest: "build/img/",
    },
    scss: {
        watch: "src/scss/**/*.scss",
        src: "src/scss/style.scss",
        dest: "build/css/",
    },
    pug: {
        watch: "src/**/*.pug",
        src: "src/index.pug",
        dest: "build/",
    },
};

// Bundling
const ts = () =>
    gulp
        .src(routes.ts.src(), {
            allowEmpty: true,
            since: gulp.lastRun(ts),
            sourcemaps: true,
        })
        .pipe(tsProject())
        .pipe(gulp.dest(routes.ts.dest, { sourcemaps: "." }));

const img = () =>
    gulp.src(routes.img.src).pipe(gulpImage()).pipe(gulp.dest(routes.img.dest));
const css = () =>
    gulp
        .src(routes.scss.src)
        .pipe(scss().on("error", scss.logError))
        .pipe(autoprefixer())
        .pipe(csso())
        .pipe(gulp.dest(routes.scss.dest));
const html = () =>
    gulp.src(routes.pug.src).pipe(pug()).pipe(gulp.dest(routes.pug.dest));

// Publish
const ghPage = () => gulp.src(routes.deploy).pipe(ghPages());
// Util
const streamDel = () => deleteAsync(routes.delete);

// CI
const watch = () => {
    gulp.watch(routes.ts.watch, ts);
    gulp.watch(routes.img.watch, img);
    gulp.watch(routes.pug.watch, html);
    gulp.watch(routes.scss.watch, css);
};

// nodemon
// const server = () =>
//   nodemon({
//     script: routes.ts.src(),
//     ext: "ts",
//   });
// WebServer
const server = () =>
    gulp.src(routes.run).pipe(webserver({ livereload: true, open: true }));

// Gulp cli
const prepare = gulp.series([streamDel, img]);
const assets = gulp.series([css, html, ts]);
const postDev = gulp.parallel([watch, server]);

export const build = gulp.series([prepare, assets]);
export const dev = gulp.series([build, postDev]);
export const deploy = gulp.series([build, ghPage]);
