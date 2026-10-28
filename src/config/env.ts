import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number.parseInt(process.env.PORT ?? "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret",
  OPEN_LIBRARY_API_KEY: process.env.OPEN_LIBRARY_API_KEY ?? process.env.GOOGLE_BOOKS_API_KEY ?? "",
};

export default env;
