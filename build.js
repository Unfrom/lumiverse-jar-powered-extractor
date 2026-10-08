import * as esbuild from 'esbuild';

const isDev = process.argv.includes('--dev');

async function build() {
  console.log('[build] Building Lumiverse JAR Extractor extension...');

  // Build backend (targeted for Bun worker environment)
  await esbuild.build({
    entryPoints: ['src/backend.ts'],
    outfile: 'dist/backend.js',
    bundle: true,
    format: 'esm',
    target: 'es2022',
    platform: 'node',
    minify: !isDev,
    sourcemap: isDev,
  });
  console.log('[build] dist/backend.js created');

  // Build frontend (browser environment)
  await esbuild.build({
    entryPoints: ['src/frontend.ts'],
    outfile: 'dist/frontend.js',
    bundle: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    minify: !isDev,
    sourcemap: isDev,
  });
  console.log('[build] dist/frontend.js created');

  console.log('[build] Build completed successfully!');
}

build().catch((err) => {
  console.error('[build] Build failed:', err);
  process.exit(1);
});
