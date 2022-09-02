const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
module.exports = withSentryConfig(
  {
    reactStrictMode: false,
    env: {
      MAINNET_PRIMARY: process.env.MAINNET_PRIMARY,
      MAINNET_PRIMARY_BETA: process.env.MAINNET_PRIMARY_BETA,
      MAINNET_SECONDARY: process.env.MAINNET_SECONDARY,
      BASE_CLUSTER: process.env.BASE_CLUSTER || 'devnet',
      NEXT_PUBLIC_BASE_URL:
        process.env.NEXT_PUBLIC_BASE_URL || 'https://rent.cardinal.so',
    },
    async rewrites() {
      return [
        {
          source: '/:path*{/}?',
          has: [
            {
              type: 'host',
              value: '(?<hostName>.*)',
            },
          ],
          destination: '/:hostName/:path*',
        },
        {
          source: '/:hostName/:collection/claim/:tokenManagerString*',
          destination: '/:hostName/:collection/:tokenManagerString*',
        },
        {
          source: '/:hostName/claim/:tokenManagerString*',
          destination: '/:hostName/default/:tokenManagerString*',
        },
      ]
    },
  },
  {
    // Additional config options for the Sentry Webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, org, project, authToken, configFile, stripPrefix,
    //   urlPrefix, include, ignore

    silent: true, // Suppresses all logs
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
  }
)
