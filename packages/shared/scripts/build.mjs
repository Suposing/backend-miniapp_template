import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// API 使用 CommonJS，两个前端使用 ESM；由同一份 TypeScript 源码生成两套入口。
const root = new URL('../', import.meta.url);
const esmDirectory = new URL('dist/esm/', root);
mkdirSync(esmDirectory, { recursive: true });
writeFileSync(new URL('package.json', esmDirectory), '{"type":"module"}\n');

const require = createRequire(import.meta.url);
const compiler = spawn(
    process.execPath,
    [
        require.resolve('typescript/bin/tsc'),
        '-b',
        'tsconfig.json',
        'tsconfig.esm.json',
        ...process.argv.slice(2),
    ],
    { cwd: fileURLToPath(root), stdio: 'inherit' },
);
compiler.on('error', (error) => {
    throw error;
});
compiler.on('exit', (code) => {
    process.exitCode = code ?? 1;
});
