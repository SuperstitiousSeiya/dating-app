import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Spark",
  slug: "spark-dating",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "spark",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ff3070",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.spark.dating",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Spark needs your location to show profiles near you.",
      NSCameraUsageDescription: "Spark needs camera access to upload profile photos.",
      NSPhotoLibraryUsageDescription:
        "Spark needs photo library access to select profile photos.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ff3070",
    },
    package: "com.spark.dating",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
    ],
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#ff3070",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env["EXPO_PUBLIC_API_URL"],
    wsUrl: process.env["EXPO_PUBLIC_WS_URL"],
    eas: {
      projectId: process.env["EAS_PROJECT_ID"] ?? "",
    },
  },
};

export default config;
