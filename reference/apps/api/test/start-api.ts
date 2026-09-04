import { type ChildProcess, spawn } from 'node:child_process';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    apiUrl: string;
  }
}

const PORT = 3101;
const apiUrl = `http://localhost:${PORT}`;

async function waitForApi(child: ChildProcess) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`API exited with code ${child.exitCode}`);
    try {
      const res = await fetch(`${apiUrl}/hello`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('API did not start in time');
}

export default async function startApi(project: TestProject) {
  const child = spawn('node', ['dist/main.js'], {
    env: { ...process.env, PORT: String(PORT), LOG_LEVEL: 'silent' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  await waitForApi(child);
  project.provide('apiUrl', apiUrl);
  return () => {
    child.kill();
  };
}
