import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
    entry: 'src/main.js',
    plugins: [
        json(),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    format: 'umd',
    dest: 'dist/app.js'
};