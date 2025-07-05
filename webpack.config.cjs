const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './dist/index.js',
  output: {
    filename: 'bundle.cjs',
    path: path.resolve(__dirname, 'bundle'),
  },
  resolve: {
    extensions: ['.js'],
  },
  optimization: {
    minimize: false
  }
};
