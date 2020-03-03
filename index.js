"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = __importStar(require("postcss"));
const filterParam = 'device-pixel-ratio';
// filterParams = filterParams.map(param => getParams(param));
function getIndex(root, rule) {
    let index = root.index(rule);
    while (index === -1 && rule.parent.type !== 'root') {
        rule = rule.parent;
        index = root.index(rule);
    }
    return index;
}
function getRules(root) {
    const rules = [];
    root.walkRules(rule => {
        rules.push(rule);
    });
    return rules;
}
function canMerge(root, rules, rule, atRule) {
    return !(rules.some(r => {
        if (r.selector === rule.selector) {
            const index = getIndex(root, r);
            const atIndex = getIndex(root, atRule);
            const ruleIndex = getIndex(root, rule);
            return index > ruleIndex && index < atIndex;
        }
    }));
}
function getParams(params) {
    return params.replace(/\s/g, '');
}
const myPlugin = postcss.plugin('postcss-merge-media', () => {
    return (root) => {
        const atRules = [];
        const filterAtRules = {};
        root.walkAtRules(atRule => {
            atRules.push(atRule);
        });
        atRules.forEach((r) => {
            if (getParams(r.params).includes(filterParam)) {
                filterAtRules[r.params] = {
                    atRule: r,
                    index: getIndex(root, r)
                };
            }
        });
        const orderFilterAtRules = Object.keys(filterAtRules).map(key => filterAtRules[key]).sort((a, b) => {
            return a.index - b.index;
        });
        orderFilterAtRules.reverse().forEach(({ atRule }) => {
            const rules = getRules(root);
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
            });
        });
    };
});
exports.default = myPlugin;
