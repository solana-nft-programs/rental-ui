// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
if (
  !process.env.LD_LIBRARY_PATH ||
  !process.env.LD_LIBRARY_PATH.includes(
    `${process.env.PWD}/node_modules/canvas/build/Release:`
  )
) {
  process.env.LD_LIBRARY_PATH = `${
    process.env.PWD
  }/node_modules/canvas/build/Release:${process.env.LD_LIBRARY_PATH || ''}`
}

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  env: {
    MAINNET_PRIMARY: process.env.MAINNET_PRIMARY,
    BASE_CLUSTER: process.env.BASE_CLUSTER || 'devnet',
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
    ]
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /awesome-qr/,
        })
      )
    }
    return config
  },
}
