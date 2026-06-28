import { spawn } from 'node:child_process';
import path from 'node:path';

const nextBin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'next.cmd' : 'next',
);

const env = { ...process.env };
env.VERCEL = '';
env.VERCEL_ENV = 'development';
env.VERCEL_TARGET_ENV = 'development';
env.VERCEL_URL = 'localhost:3000';

const child = spawn(nextBin, ['dev', ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  windowsHide: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
