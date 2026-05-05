import { PrismaClient } from "@prisma/client";

// NOTE: In VS Code / Vercel, ensure your DATABASE_URL in .env is URL-encoded.
// Specifically, replace "##" with "%23%23" in your password.
const dbUrl = process.env.DATABASE_URL?.replace(/aqdas1609##/g, "aqdas1609%23%23")?.replace(/#/g, "%23");

const db = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

export default db;