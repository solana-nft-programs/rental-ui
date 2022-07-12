const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
  mode: devMode ? 'development' : 'production',
  entry: {
    index: { import: './src/index.ts' },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  output: {
    filename: 'components.bundle.min.js',
    library: 'fstrComponents',
    libraryTarget: 'umd',
    clean: true,
  },
  plugins: [].concat(devMode ? [] : [new MiniCssExtractPlugin()]),
}
