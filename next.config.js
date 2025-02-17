/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
      },
      images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'images.unsplash.com',
          },
          {
            protocol: 'https',
            hostname: 'd1feinjv20w49o.cloudfront.net',
          },
          {
            protocol: 'https',
            hostname: 'd2gwn3li2a4yd4.cloudfront.net',
          },
          {
            protocol: 'https',
            hostname: 'd1hg2ojqsrjmn2.cloudfront.net',
          },
          {
            protocol: 'https',
            hostname: 'd3ccalzj3riujb.cloudfront.net',
          }
        ]
    },
    env: {
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    }
}

module.exports = nextConfig
