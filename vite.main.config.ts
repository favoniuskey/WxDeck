import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { builtinModules } from 'node:module';

function xorEncode(input: string, key: string): string {
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
  }
  return Buffer.from(out).toString('base64');
}

const XOR_KEY = 'WxDeck/FavoniusKey-2026/keepFlying';
const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`)
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = env.AVWX_TOKEN ?? '';
  const encoded = token ? xorEncode(token, XOR_KEY) : '';

  return {
    build: {
      outDir: 'dist/main',
      emptyOutDir: true,
      ssr: true,
      target: 'node20',
      lib: {
        entry: resolve(__dirname, 'src/main/index.ts'),
        formats: ['cjs'],
        fileName: () => 'index.cjs'
      },
      rollupOptions: {
        external: [
          'electron',
          'electron-store',
          'electron-updater',
          ...nodeBuiltins
        ]
      },
      minify: mode === 'production',
      sourcemap: mode !== 'production'
    },
    define: {
      __AVWX_TOKEN_ENC__: JSON.stringify(encoded),
      __XOR_KEY__: JSON.stringify(XOR_KEY)
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
        '@main': resolve(__dirname, 'src/main')
      }
    }
  };
});
