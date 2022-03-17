// For building on vercel: https://github.com/Automattic/node-canvas/issues/1779
if (
  process.env.LD_LIBRARY_PATH == null ||
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
  reactStrictMode: true,
  env: {
    BASE_PROJECT: process.env.BASE_PROJECT || 'cardinal',
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    BASE_CLUSTER: process.env.BASE_CLUSTER || 'devnet',
  },
  async rewrites() {
    return [
      {
        source: '/:path*{/}?',
        has: [
          {
            type: 'host',
            value: '(?<configName>.*)',
          },
        ],
        destination: '/:configName/:path*',
      },
    ]
  },
}
