module.exports = {
    plugins: [require('./postcss/scope.cjs')({ scope: '[data-block-id]' }), require('autoprefixer')],
};
