module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // WAŻNE: react-native-reanimated/plugin MUSI być ostatni!
      'react-native-reanimated/plugin',
    ],
  };
};
