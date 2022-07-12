const path = require('path')
const fs = require('fs')
const { merge } = require('webpack-merge')

function getPackageDir(filepath) {
  let currDir = path.dirname(require.resolve(filepath))
  while (true) {
    if (fs.existsSync(path.join(currDir, 'package.json'))) {
      return currDir
    }
    const { dir, root } = path.parse(currDir)
    if (dir === root) {
      throw new Error(
        `Could not find package.json in the parent directories starting from ${filepath}.`
      )
    }
    currDir = dir
  }
}

module.exports = {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    'storybook-dark-mode',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    {
      name: '@storybook/addon-storysource',
      options: {
        rule: {
          include: [
            path.resolve(__dirname, '../src'),
            path.resolve(__dirname, '../src'),
          ],
        },
        loaderOptions: {
          prettierConfig: { printWidth: 80, singleQuote: false },
        },
      },
    },
    {
      name: '@storybook/addon-postcss',
      options: {
        cssLoaderOptions: {
          // When you have splitted your css over multiple files
          // and use @import('./other-styles.css')
          importLoaders: 2,
        },
        postcssLoaderOptions: {
          // When using postCSS 8
          implementation: require('postcss'),
        },
      },
    },
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  webpackFinal: async (config) => {
    return merge(config, {
      resolve: {
        fallback: {
          fs: false,
        },
        roots: [path.resolve(__dirname, '../public'), 'node_modules'],
        alias: {
          '@emotion/core': getPackageDir('@emotion/react'),
          '@emotion/styled': getPackageDir('@emotion/styled'),
          'emotion-theming': getPackageDir('@emotion/react'),
          '@': [
            path.resolve(__dirname, '../src/'),
            path.resolve(__dirname, '../'),
          ],
        },
      },
    })
  },
}
