import { registerAs } from "@nestjs/config";

export const databaseConfig = registerAs("database", () => ({
  mongoUri: process.env["MONGODB_URI"] ?? "mongodb://localhost:27017/dating-app",
  redisUrl: process.env["REDIS_URL"] ?? "redis://localhost:6379",
}));
