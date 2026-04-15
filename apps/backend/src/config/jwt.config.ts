import { registerAs } from "@nestjs/config";

export const jwtConfig = registerAs("jwt", () => ({
  accessSecret: process.env["JWT_ACCESS_SECRET"] ?? "dev-access-secret-change-me",
  refreshSecret: process.env["JWT_REFRESH_SECRET"] ?? "dev-refresh-secret-change-me",
  accessExpiresIn: "15m",
  refreshExpiresIn: "30d",
  refreshExpiresInSeconds: 30 * 24 * 60 * 60,
}));
