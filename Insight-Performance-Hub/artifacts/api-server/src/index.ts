import "./Configuration/database";
import app from "./app";
import { seedDatabase } from "./Services/seed";
import { startMfmaReminderScheduler } from "./Services/mfma-reminders";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await seedDatabase();
  startMfmaReminderScheduler();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
