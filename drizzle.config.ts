import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  out: "./drizzle",
  // For local development, we'll use wrangler's local D1 setup
  // For production, you can set environment variables for HTTP driver
});
