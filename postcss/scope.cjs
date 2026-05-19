module.exports = (opts = {}) => {
    return {
        postcssPlugin: 'scope',
        Root(root) {
            root.walkRules((rule) => {
                if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name.includes('keyframes')) {
                    return;
                }
                rule.selectors = rule.selectors.map((originalSelector) =>
                    originalSelector
                        .split(/(?<!\\),\s*/g)
                        .map((individualSelector) => getScopedSelector(individualSelector, opts.scope))
                        .join(', '),
                );
            });
        },
    };
};

module.exports.postcss = true;

const getScopedSelector = (selector, scope) => {
    if (selector.startsWith(scope)) {
        return selector;
    }

    if (selector === ':root') {
        return scope;
    }

    return `${scope} ${selector}`;
};
