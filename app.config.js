import 'dotenv/config';

export default {
  expo: {
    name: "bolt-expo-nativewind",
    slug: "bolt-expo-nativewind",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true
    },
    extra: {
      API_URL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.107:5001"  // ✅ Fallback for debugging
    }
  }
};
