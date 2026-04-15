import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  port: parseInt(process.env["PORT"] ?? "3001", 10),
  allowedOrigins: (process.env["ALLOWED_ORIGINS"] ?? "http://localhost:3000").split(","),
  cloudinary: {
    cloudName: process.env["CLOUDINARY_CLOUD_NAME"] ?? "",
    apiKey: process.env["CLOUDINARY_API_KEY"] ?? "",
    apiSecret: process.env["CLOUDINARY_API_SECRET"] ?? "",
  },
  resend: {
    apiKey: process.env["RESEND_API_KEY"] ?? "",
    fromEmail: process.env["RESEND_FROM_EMAIL"] ?? "noreply@dating-app.dev",
  },
  stripe: {
    secretKey: process.env["STRIPE_SECRET_KEY"] ?? "",
    webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] ?? "",
  },
  expo: {
    accessToken: process.env["EXPO_ACCESS_TOKEN"] ?? "",
  },
}));
