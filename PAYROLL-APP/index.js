// Load the monorepo root .env so AZURE_DATABASE_URL (the Payroll database) and
// PORT are available even when this API is started without exported env vars.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

require('./src/server/index.js');
