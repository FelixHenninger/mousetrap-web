const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'mousetrap.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'mousetrap',
    libraryTarget: 'umd',
  },
}
