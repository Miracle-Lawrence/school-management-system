import { db } from "../src/prisma/db";

async function main() {
  try {
    await db.connect();
    console.log("SUCCESS: Connected to the production database.");
  } catch (error) {
    console.error("FAILED: Database connection unsuccessful.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}

main();
