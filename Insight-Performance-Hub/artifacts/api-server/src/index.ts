import app from "./app";
import { seedDatabase } from "./seed";

const FIXED_PORT = 6800;
const port = FIXED_PORT;

async function start() {
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
