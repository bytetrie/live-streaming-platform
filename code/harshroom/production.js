var rollup = require('rollup').rollup;
var json = require('rollup-plugin-json');
var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');
var nodeResolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var sass = require('node-sass');
var fs = require('fs');

var pug = require('pug');
var index = {
    file: './src/index.pug',
    data: require('./index.config.json')
};


rollup({
    entry: 'src/main.js',
    plugins: [
        json(),
        nodeResolve({
            skip: [ 'react', 'react-dom' ]
        }),
        commonjs(),
        babel(),
        uglify({})
    ]
}).then(function (bundle) {
    bundle.write({
        format: 'umd',
        dest: 'dist/app.js'
    });
    console.log("JS saved");
});


sass.render({
        file: 'src/main.scss',
        outputStyle: 'compressed'
    },
    function (error, result) {
        if (error) {
            console.log(error.status);
            console.log(error.column);
            console.log(error.message);
            console.log(error.line);
        } else {
            fs.writeFile('dist/app.css', result.css, function (err) {
                if (!err)
                    console.log("CSS saved");
            });
        }
    });


var fn = pug.compileFile(index.file);
index.data.mode = "prod";
var html = fn(index.data);
fs.writeFile('dist/index.html', html, function (err) {
    if (!err)
        console.log("HTML saved");
});