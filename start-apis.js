const { spawn } = require('child_process');
const path = require('path');

const workspace = '/home/runner/workspace';

function startProcess(name, cmd, args, cwd, env) {
  const proc = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
  proc.on('exit', (code) => console.log(`[${name}] exited with code ${code}`));
  proc.on('error', (err) => console.error(`[${name}] error:`, err.message));
  return proc;
}

startProcess('AFS-API', 'npx', ['tsx', 'index.ts'], path.join(workspace, 'AFS-UI/api'), { PORT: '9000' });
startProcess('POS-API', 'npx', ['tsx', 'index.ts'], path.join(workspace, 'POS-API'), { PORT: '3003' });
startProcess('OVERTIME-API', 'dotnet', ['bin/Debug/net10.0/PlatinumOvertime-API.dll'], path.join(workspace, 'OVERTIME-API'), { ASPNETCORE_URLS: 'http://0.0.0.0:8099', ASPNETCORE_ENVIRONMENT: 'Development' });

startProcess('IPH-API', 'pnpm', ['--filter', '@workspace/api-server', 'run', 'dev'], path.join(workspace, 'Insight-Performance-Hub'), {
  PORT: '8080',
  APP_DATABASE_URL: 'postgresql://Admin_Dev:NOP%40ssword_123@platinum-postgre-sql.postgres.database.azure.com:5432/Performance?sslmode=require',
});
startProcess('IPH-MOCKUP', 'pnpm', ['--filter', '@workspace/mockup-sandbox', 'run', 'dev'], path.join(workspace, 'Insight-Performance-Hub'), { PORT: '8081', BASE_PATH: '/' });
startProcess('IPH-PERF', 'pnpm', ['--filter', '@workspace/perf-app', 'run', 'dev'], path.join(workspace, 'Insight-Performance-Hub'), { PORT: '18156' });

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
