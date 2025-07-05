const path = require('path');
const nodeExternals = require('webpack-node-externals');

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
  // Don't bundle these modules, but include them in the bundle as external dependencies
  externals: [nodeExternals()],
  optimization: {
    minimize: false
  },
  stats: {
    errorDetails: true
  }
};
