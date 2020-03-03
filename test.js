const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const cssnano = require('cssnano');
const fs = require('fs');
const myPlugin = require('./index').default;

fs.readFile('index2.css', (err, css) => {
    if (err) return;
    postcss([myPlugin])
        .process(css, { from: 'index2.css', to: 'lib.css' })
        .then(result => {
            fs.writeFile('lib.css', result.css, () => true)
        })
})