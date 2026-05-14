module.exports = {
    plugins: [require('./postcss/scope.cjs')({ scope: '.range-slider-v2' }), require('autoprefixer')],
};
