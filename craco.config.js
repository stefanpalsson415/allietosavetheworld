// CRACO configuration for advanced webpack customization
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Add bundle analyzer in production build with ANALYZE=true
      if (process.env.ANALYZE === 'true') {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'bundle-report.html',
            openAnalyzer: false,
          })
        );
      }

      // Optimize chunks
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate large libraries
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 30,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 30,
            },
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 25,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@mui|@emotion|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };

      return webpackConfig;
    },
  },
};