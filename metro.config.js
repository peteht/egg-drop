const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// React Native 0.81+ uses private class field syntax (#field) in source files
// like EventEmitter.js. Ensure those files are not skipped by the Babel
// transformer so the syntax is downgraded before Hermes compiles the bundle.
const defaultBlockList = config.resolver?.blockList ?? [];
config.resolver = {
  ...config.resolver,
  blockList: defaultBlockList,
};

// Keep the default transformIgnorePatterns but make sure react-native's own
// Library files go through Babel (they do by default, but be explicit).
config.transformer = {
  ...config.transformer,
};

module.exports = config;
