// var globby = require('globby');
var path = require('path');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: './src/index.js',
  externals: {
    react: 'react'
  },
  output: {
    path: path.resolve(__dirname, './build'),
    // path: path.resolve(__dirname, '../tracker-test01/'),
    filename: 'log.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              "@babel/plugin-transform-modules-commonjs",
              [		
                '@babel/plugin-transform-runtime',		
                {		
                  corejs: 2
                }		
              ]
            ],
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()]
  }
}