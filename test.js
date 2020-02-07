const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const cssnano = require('cssnano');
const fs = require('fs');
const myPlugin = require('./index');

fs.readFile('index.css', (err, css) => {
    if (err) return;
    postcss([autoprefixer, myPlugin, cssnano])
        .process(css, { from: 'index.css', to: 'lib.css' })
        .then(result => {
            fs.writeFile('lib.css', result.css, () => true)
        })
})