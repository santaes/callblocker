module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
          },
        },
      ],
    ],
  };
};

// Import polyfills for Node.js environment
if (typeof window === 'undefined') {
  require('./polyfills.js');
}
