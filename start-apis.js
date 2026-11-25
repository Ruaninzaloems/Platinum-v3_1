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
startProcess('OVERTIME-API', 'dotnet', ['run', '--project', 'PlatinumOvertime-API.csproj', '--no-launch-profile', '-c', 'Debug'], path.join(workspace, 'OVERTIME-API'), { ASPNETCORE_URLS: 'http://0.0.0.0:8099', ASPNETCORE_ENVIRONMENT: 'Development' });

// Insight-Performance-Hub services (api-server, mockup-sandbox, perf-app) are
// managed as dedicated Replit workflows. Do NOT spawn them here — that would
// cause double-spawn and port conflicts.

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
