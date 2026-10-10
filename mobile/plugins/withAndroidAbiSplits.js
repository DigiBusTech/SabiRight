const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidAbiSplits(config) {
  return withAppBuildGradle(config, config => {
    const contents = config.modResults.contents;
    if (contents.includes('include "armeabi-v7a", "arm64-v8a"')) return config;

    config.modResults.contents = contents.replace(
      /android\s*\{/,
      `android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a"
            universalApk false
        }
    }`
    );
    return config;
  });
};
