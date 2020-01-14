import * as autoprefixer from 'autoprefixer';
import * as postcss from 'postcss';
import * as cssnano from 'cssnano';
import * as fs from 'fs';

const filterParams = [
    '(-webkit-min-device-pixel-ratio: 2.5),(min-device-pixel-ratio:2.5),(-webkit-min-device-pixel-ratio:2.5),(min-resolution:2.5dppx),(min-resolution:240dpi)',
    '(-webkit-min-device-pixel-ratio: 1.5) and (-webkit-max-device-pixel-ratio:2.49),(-webkit-min-device-pixel-ratio:1.5) and (-webkit-max-device-pixel-ratio:2.4895833333333335),(min-device-pixel-ratio:1.5) and (max-device-pixel-ratio:2.49),(-webkit-min-device-pixel-ratio:1.5) and (-webkit-max-device-pixel-ratio:2.49),(min-resolution:1.5dppx) and (max-resolution:2.49dppx),(min-resolution:144dpi) and (max-resolution:239dpi)',
    '(-webkit-max-device-pixel-ratio: 1.49),(-webkit-max-device-pixel-ratio:1.4895833333333333),(max-device-pixel-ratio:1.49),(-webkit-max-device-pixel-ratio:1.49),(max-resolution:1.49dppx),(max-resolution:143dpi)'
]

function getIndex(root: postcss.Root, rule: postcss.ChildNode) {
    let index = root.index(rule)
    while(index === -1 && rule.parent.type !== 'root') {
        rule = rule.parent;
        index = root.index(rule)
    }
    return index;
}

function getRules(root: postcss.Root): postcss.Rule[] {
    const rules = []
    root.walkRules(rule => {
        rules.push(rule);
    })
    return rules;
}

function canMerge(root: postcss.Root, rules: postcss.Rule[], rule: postcss.Rule, atRule: postcss.AtRule) {
    return !(rules.some(r => {
        if (r.selector === rule.selector) {
            const index = getIndex(root, r);
            const atIndex = getIndex(root, atRule);
            const ruleIndex = getIndex(root, rule);
            return index > ruleIndex && index < atIndex
        }
    }))
}

const myPlugin = postcss.plugin('myplugin', () => {
    return (root) => {
        const atRules = [];
        const filterAtRules: {[name: string]: {
            atRule: postcss.AtRule
            index: number
        }} = {};
        root.walkAtRules(atRule => {
            atRules.push(atRule);
        })

        atRules.forEach((r: postcss.AtRule) => {
            if (filterParams.includes(r.params)) {
                filterAtRules[r.params] = {
                    atRule: r,
                    index: getIndex(root, r)
                }
            }
        })

        console.log(1)
        
        const orderFilterAtRules = Object.keys(filterAtRules).map(key => filterAtRules[key]).sort((a, b) =>{
            return a.index - b.index;
        })

        orderFilterAtRules.reverse().forEach(({atRule}) => {
            const rules = getRules(root)
            rules.reverse().forEach(rule => {
                const parent = rule.parent;
                if (parent.type === 'atrule' && parent.params === atRule.params && parent !== atRule) {
                    const merge = canMerge(root, rules, rule, atRule);
                    if (merge) {
                        atRule.prepend(rule);
                        if (parent.nodes.length === 0) {
                            parent.remove();
                        }
                    }
                }
            })
        })
    }
})
fs.readFile('index.css', (err, css) => {
    if (err) return;
    postcss([autoprefixer, cssnano, myPlugin])
        .process(css, { from: 'index.css', to: 'lib.css' })
        .then(result => {
            fs.writeFile('lib.css', result.css, () => true)
        })
})