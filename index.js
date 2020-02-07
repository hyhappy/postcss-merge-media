"use strict";
exports.__esModule = true;
var postcss = require("postcss");
var filterParams = [
    '(-webkit-min-device-pixel-ratio:2.5), (min-device-pixel-ratio: 2.5), (min-resolution: 240dpi), (min-resolution: 2.5dppx)',
    '(-webkit-min-device-pixel-ratio:1.5) and (-webkit-max-device-pixel-ratio: 2.49), (min-device-pixel-ratio: 1.5) and (max-device-pixel-ratio: 2.49), (min-resolution: 144dpi) and (max-resolution: 239dpi), (min-resolution: 1.5dppx) and (max-resolution: 2.49dppx)',
    '(-webkit-max-device-pixel-ratio:1.49), (max-device-pixel-ratio: 1.49), (max-resolution: 143dpi), (max-resolution: 1.49dppx)'
];
filterParams = filterParams.map(function (param) { return getParams(param); });
function getIndex(root, rule) {
    var index = root.index(rule);
    while (index === -1 && rule.parent.type !== 'root') {
        rule = rule.parent;
        index = root.index(rule);
    }
    return index;
}
function getRules(root) {
    var rules = [];
    root.walkRules(function (rule) {
        rules.push(rule);
    });
    return rules;
}
function canMerge(root, rules, rule, atRule) {
    return !(rules.some(function (r) {
        if (r.selector === rule.selector) {
            var index = getIndex(root, r);
            var atIndex = getIndex(root, atRule);
            var ruleIndex = getIndex(root, rule);
            return index > ruleIndex && index < atIndex;
        }
    }));
}
function getParams(params) {
    return params.replace(/\s/g, '');
}
var myPlugin = postcss.plugin('postcss-merge-media', function () {
    return function (root) {
        var atRules = [];
        var filterAtRules = {};
        root.walkAtRules(function (atRule) {
            atRules.push(atRule);
        });
        atRules.forEach(function (r) {
            if (filterParams.includes(getParams(r.params))) {
                filterAtRules[r.params] = {
                    atRule: r,
                    index: getIndex(root, r)
                };
            }
        });
        var orderFilterAtRules = Object.keys(filterAtRules).map(function (key) { return filterAtRules[key]; }).sort(function (a, b) {
            return a.index - b.index;
        });
        orderFilterAtRules.reverse().forEach(function (_a) {
            var atRule = _a.atRule;
            var rules = getRules(root);
            rules.reverse().forEach(function (rule) {
                var parent = rule.parent;
                if (parent.type === 'atrule' && getParams(parent.params) === getParams(atRule.params) && parent !== atRule) {
                    var merge = canMerge(root, rules, rule, atRule);
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

module.exports = myPlugin;
