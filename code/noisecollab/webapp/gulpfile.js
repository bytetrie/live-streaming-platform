const gulp = require("gulp")
const sass = require("gulp-sass")
const uglify = require("gulp-uglify")
const pug = require("gulp-pug")
const concat = require("gulp-concat")
const rollup = require('rollup-stream')
const sourcemaps = require('gulp-sourcemaps')
const autoprefixer = require('gulp-autoprefixer')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const babel = require('rollup-plugin-babel')
const path = require("path")
const livereload = require('livereload')
const server = livereload.createServer()
const devDir = path.join(__dirname, "dev")
const pubDir = path.join(__dirname, "public")
let prod = false
let cache

const errorMan0 = error => {
    console.error('' + error)
    this.emit('end')
}

const errorMan1 = error => {
    console.error('' + error)
}


gulp.task("views", () => {
    return gulp.src(path.join(devDir, "index.pug"))
        .pipe(pug({
            locals: {
                prod: prod
            }
        }))
        .pipe(gulp.dest(pubDir))
})

gulp.task("styles", () => {
    return gulp.src(path.join(devDir, "sass", "main.scss"))
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(concat("main.css"))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(pubDir))
})

gulp.task("scripts", () => {
    return rollup({
            entry: path.join(devDir, "js", "main.js"),
            cache: cache,
            sourceMap: true,
            format: 'es',
            plugins: [
                babel({
                    exclude: 'node_modules/**'
                }),
                resolve(),
                commonjs()
            ]
        })
        .on('error', errorMan0)
        .on('bundle', function(bundle) {
            cache = bundle
        })
        .pipe(source('main.js', path.join(devDir, "js")))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify().on('error', errorMan1))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(pubDir))
})

gulp.task("watch", ["default"], () => {
    server.watch(pubDir)
    gulp.watch(path.join(devDir, "*.pug"), ["views"])
    gulp.watch(path.join(devDir, "sass", "*.scss"), ["styles"])
    gulp.watch(path.join(devDir, "js", "*.js"), ["scripts"])
})

gulp.task("setProd", () => {
    prod = true
})

gulp.task("default", ["views", "styles", "scripts"])

gulp.task("prod", ["setProd", "default"])