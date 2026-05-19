module.exports = {
    plugins: [require('./postcss/scope.cjs')({ scope: '[data-range-slider-block]' }), require('autoprefixer')],
};
