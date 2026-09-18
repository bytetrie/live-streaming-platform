const blessed = require('blessed');
const chokidar = require('chokidar');
const rollup = require( 'rollup' ).rollup;
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
const sass = require('node-sass');
const fs = require('fs');
const pug = require('pug');
const path = require('path');
const express = require('express');
const app = express();
const livereload = require('livereload');

let index = {
    file: './src/index.pug',
    data: require('./index.config.json')
};
let tasksRun = 0;
let cache;


/**
 * Node Express Development Server
 * @param done: returns output for logging
 */
let server = function (done) {
    const server = livereload.createServer();

    server.watch(path.join(__dirname, 'dist'));

    app.set('port', (process.env.PORT || 3000));

    app.use('/', express.static(path.join(__dirname, 'dist')));
    // app.use('/media', express.static(path.join(__dirname, 'media')));

    app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        next();
    });

    // app.get('/:file', function (req, res) {
    //     res.sendFile(path.join(__dirname, 'dist', req.param.file));
    // });

    app.listen(app.get('port'), '0.0.0.0', function () {
        let text = 'Server started: http://localhost:' + app.get('port') + '/';
        done(text);
    });
};




// Create a screen object.
let screen = blessed.screen({
    smartCSR: true
});
screen.title = 'DEV';

/**
 * Box0 includes output from the rollup script compiler
 * It watches all js files in the src directory, outputting
 * the compiled result to the dist directory
 */
let box0 = blessed.box({
    top: '0',
    left: '0',
    width: '50%',
    height: '75%',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        inverse: true
    },
    content: 'Click to force compilation of files...',
    tags: true,
    style: {
        fg: 'white',
        bg: '#232323'
    }
});
screen.append(box0);
screen.key(['0'], function() {
    box0.focus();
});
let watcher0 = chokidar.watch('src/**/*.js', {
    ignored: /[\/\\]\./,
    persistent: true
});
let compileScripts = function(text) {
    box0.pushLine((tasksRun++) + ": " + text);
    rollup({
        entry: 'src/main.js',
        cache: cache,
        external: [
          'react', 'react-dom'
        ],
        plugins: [
            json(),
            nodeResolve({
                skip: [ 'react', 'react-dom' ]
            }),
            commonjs({
                namedExports: {
                    'node_modules/marked/marked.min.js': [ 'marked' ]
                }
            }),
            babel()
        ],
        onwarn: function() {
            // box0.pushLine((tasksRun++) + ": " + text);
        }
    }).then( function ( bundle ) {
        cache = bundle;
        bundle.write({
            format: 'umd',
            dest: 'dist/app.js'
        });
    });
    box0.setScrollPerc(100);
    screen.render();
};
watcher0
    // .on('add', path => compileScripts(`File ${path} has been added`))
    .on('change', path => compileScripts(`File ${path} has been changed`));
    // .on('unlink', path => compileScripts(`File ${path} has been removed`));

// If our box is clicked, force recompile
box0.key(['r'], function() {
    compileScripts(`Forcing compile`);
    screen.render();
});
box0.key(['up'], function() {
    box0.scroll(-1);
    screen.render();
});
box0.key(['down'], function() {
    box0.scroll(1);
    screen.render();
});

/**
 * Box1 includes output from the sass compiler
 * It watches all scss files in the src directory, outputting
 * the compiled result to the dist directory
 */
let box1 = blessed.box({
    top: '0',
    left: '50%',
    width: '50%',
    height: '75%',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        inverse: true
    },
    content: 'Click to force compilation of files...',
    tags: true,
    style: {
        fg: 'white',
        bg: '#111111'
    }
});
screen.append(box1);
screen.key(['1'], function() {
    box1.focus();
});
let watcher1 = chokidar.watch('src/**/**/**/*.scss', {
    ignored: /[\/\\]\./,
    persistent: true
});
let compileStyles = function(text) {
    box1.pushLine((tasksRun++) + ": " + text);
    sass.render({
        file: 'src/main.scss'
    },
    function(error, result) {
        if (error) {
            box1.pushLine(error.status);
            box1.pushLine(error.column);
            box1.pushLine(error.message);
            box1.pushLine(error.line);
        }
        else {
            fs.writeFile('dist/app.css', result.css, function(err){
                if(!err)
                    box1.pushLine((tasksRun++) + ": CSS saved");
            });
        }
    });
    box1.setScrollPerc(100);
    screen.render();
};
watcher1
    // .on('add', path => compileStyles(`File ${path} has been added`))
    .on('change', path => compileStyles(`File ${path} has been changed`));
    // .on('unlink', path => compileStyles(`File ${path} has been removed`));

// If our box is clicked, force recompile
box1.key(['r'], function() {
    compileStyles(`Forcing compile`);
});
box1.key(['up'], function() {
    box1.scroll(-1);
    screen.render();
});
box1.key(['down'], function() {
    box1.scroll(1);
    screen.render();
});

/**
 * Box2 contains output from the server/livereload instance in server.js
 */
let box2 = blessed.box({
    top: '75%',
    left: '0',
    width: '100%',
    height: '25%',
    content: "Loading server...\n",
    tags: true,
    style: {
        fg: 'green',
        bg: '#333333'
    }
});
screen.append(box2);
screen.key(['2'], function() {
    box2.focus();
});
let compileHTML = function() {
    let fn = pug.compileFile(index.file);
    index.data.mode = "dev";
    let html = fn(index.data);
    fs.writeFile('dist/index.html', html, function (err) {
        if (!err)
            box2.pushLine("HTML saved");
        else
            box2.pushLine(err);
        screen.render();
    });
};
server(function(text) {
    box2.pushLine(text);
    screen.render();
    compileHTML();
});
// If our box is clicked, force recompile
box2.key(['r'], function() {
    compileHTML();
});




// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Focus on Box0
box0.focus();

// Render the screen.
screen.render();