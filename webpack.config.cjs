const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: ['./debug-railway.js', './dist/index.js'],
  output: {
    filename: 'bundle.cjs',
    path: path.resolve(__dirname, 'bundle'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  optimization: {
    minimize: false
  },
  stats: {
    errorDetails: true
  }
};
