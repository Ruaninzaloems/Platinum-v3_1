import app from "./app";
import { seedDatabase } from "./seed";

// Honor the platform-provided PORT (Azure App Service, Replit) and
// fall back to 6800 only when nothing is set.
const port = parseInt(process.env.PORT || "6800", 10);

async function start() {
  await seedDatabase();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
