"use strict";
exports.__esModule = true;
var autoprefixer = require("autoprefixer");
var postcss = require("postcss");
var cssnano = require("cssnano");
var fs = require("fs");
var filterParams = [
    '(-webkit-min-device-pixel-ratio:2.5),(min-device-pixel-ratio:2.5),(min-resolution:2.5dppx),(min-resolution:240dpi)',
    '(-webkit-min-device-pixel-ratio:1.5) and (-webkit-max-device-pixel-ratio:2.49),(-webkit-min-device-pixel-ratio:1.5) and (-webkit-max-device-pixel-ratio:2.4895833333333335),(min-device-pixel-ratio:1.5) and (max-device-pixel-ratio:2.49),(min-resolution:1.5dppx) and (max-resolution:2.49dppx),(min-resolution:144dpi) and (max-resolution:239dpi)',
    '(-webkit-max-device-pixel-ratio:1.49),(-webkit-max-device-pixel-ratio:1.4895833333333333),(max-device-pixel-ratio:1.49),(max-resolution:1.49dppx),(max-resolution:143dpi)'
];
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
var myPlugin = postcss.plugin('myplugin', function () {
    return function (root) {
        var atRules = [];
        var filterAtRules = {};
        root.walkAtRules(function (atRule) {
            atRules.push(atRule);
        });
        atRules.forEach(function (r) {
            if (filterParams.includes(r.params)) {
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
                if (parent.type === 'atrule' && parent.params === atRule.params && parent !== atRule) {
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
fs.readFile('index.css', function (err, css) {
    if (err)
        return;
    postcss([autoprefixer, cssnano, myPlugin])
        .process(css, { from: 'index.css', to: 'lib.css' })
        .then(function (result) {
        fs.writeFile('lib.css', result.css, function () { return true; });
    });
});
