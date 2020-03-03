import * as postcss from 'postcss';

const filterParam = 'device-pixel-ratio';

// filterParams = filterParams.map(param => getParams(param));

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

function getParams(params: string) {
    return params.replace(/\s/g, '');
}

const myPlugin = postcss.plugin('postcss-merge-media', () => {
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
            if (getParams(r.params).includes(filterParam)) {
                filterAtRules[r.params] = {
                    atRule: r,
                    index: getIndex(root, r)
                }
            }
        })
        
        const orderFilterAtRules = Object.keys(filterAtRules).map(key => filterAtRules[key]).sort((a, b) =>{
            return a.index - b.index;
        })

        orderFilterAtRules.reverse().forEach(({atRule}) => {
            const rules = getRules(root)
            rules.reverse().forEach(rule => {
                const parent = rule.parent;
                if (parent.type === 'atrule' && getParams(parent.params) === getParams(atRule.params) && parent !== atRule) {
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

export default myPlugin;