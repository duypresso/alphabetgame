const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const mainConfig = {
  mode: 'development',
  entry: './src/main/main.ts',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};

const rendererConfig = {
  mode: 'development',
  entry: './src/renderer/index.tsx',  // Changed from index.ts to index.tsx
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
    publicPath: './'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: 'src/renderer/index.html',
          to: 'index.html'
        },
        { 
          from: 'assets',
          to: 'assets',
          noErrorOnMissing: true
        }
      ],
    }),
  ]
};

module.exports = [mainConfig, rendererConfig];
