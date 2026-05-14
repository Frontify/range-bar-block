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

const tagSelectorRegex = /^[a-zA-Z][a-zA-Z0-9-]*$/;

const getScopedSelector = (selector, scope) => {
    if (selector === ':root') {
        return scope;
    }

    if (selector.includes('tw-') || tagSelectorRegex.test(selector)) {
        return `${scope} ${selector}${getModalExtensions(selector)}`;
    }

    return selector;
};

const getModalExtensions = (selector) => {
    if (!selector.includes('.')) {
        return '';
    }

    return `, body > [role='toolbar'] ${selector}, body [data-overlay-container] ${selector}, body [role='dialog'] ${selector}, body [data-is-underlay="true"] ${selector}`;
};
