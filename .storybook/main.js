const path = require('path')

const toPath = (_path) => path.join(process.cwd(), _path)

module.exports = {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  /** Expose public folder to storybook as static */
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      /**
       * Fix Storybook issue with PostCSS@8
       * @see https://github.com/storybookjs/storybook/issues/12668#issuecomment-773958085
       */
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  framework: '@storybook/react',
  core: {
    builder: 'webpack5',
  },
  webpackFinal: async (config, { configType }) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        modules: [path.resolve(__dirname, '..'), 'node_modules'],
        alias: {
          ...config.resolve.alias,
          '@emotion/core': toPath('node_modules/@emotion/react'),
          '@emotion/styled': toPath('node_modules/@emotion/styled'),
          'emotion-theming': toPath('node_modules/@emotion/react'),
          /**
           * Add support for alias-imports
           * @see https://github.com/storybookjs/storybook/issues/11989#issuecomment-715524391
           */
          '@': [
            path.resolve(__dirname, '../src/'),
            path.resolve(__dirname, '../'),
          ],
        },
        /**
         * Fixes font import with /
         * @see https://github.com/storybookjs/storybook/issues/12844#issuecomment-867544160
         */
        roots: [path.resolve(__dirname, '../public'), 'node_modules'],
      },
    }
  },
}
