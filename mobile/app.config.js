module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID
        ? { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID }
        : {})
    }
  }
});
