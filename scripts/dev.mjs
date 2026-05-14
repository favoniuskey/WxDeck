import { spawn } from 'node:child_process';
import { createServer, build } from 'vite';
import electronPath from 'electron';

const RENDERER_PORT = 5173;
let electronProcess = null;

async function startRenderer() {
  const server = await createServer({
    configFile: 'vite.renderer.config.ts',
    server: { port: RENDERER_PORT, strictPort: true }
  });
  await server.listen();
  server.printUrls();
  return server;
}

async function watchMainAndPreload() {
  const watcher = (configFile) =>
    build({
      configFile,
      mode: 'development',
      build: { watch: {} }
    });
  await watcher('vite.preload.config.ts');
  await watcher('vite.main.config.ts');
}

function launchElectron() {
  if (electronProcess) {
    electronProcess.removeAllListeners();
    electronProcess.kill();
  }
  electronProcess = spawn(electronPath, ['.', '--no-sandbox'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: `http://localhost:${RENDERER_PORT}` }
  });
  electronProcess.on('exit', () => {
    process.exit(0);
  });
}

(async () => {
  await startRenderer();
  await watchMainAndPreload();
  setTimeout(launchElectron, 500);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
