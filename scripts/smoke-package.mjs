import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function assertFile(path) {
	assert.ok(existsSync(join(rootDir, path)), `Expected ${path} to exist after build`);
}

function unwrapDefault(module) {
	return module && typeof module === 'object' && 'default' in module ? module.default : module;
}

async function assertCodecFactory(factory, label) {
	assert.equal(typeof factory, 'function', `${label} should export a factory function`);

	const codec = factory('raw');
	const sample = { ok: true, label };
	const token = await codec.compress(sample);
	const decoded = await codec.decompress(token);

	assert.deepEqual(decoded, sample, `${label} should round-trip through raw codec`);
}

async function assertWebShareFactory(factory, label) {
	assert.equal(typeof factory, 'function', `${label} should export a factory function`);

	const engine = factory({ codecs: ['raw'] });
	const sample = { ok: true, label };
	const token = await engine.compress(sample);
	const decoded = await engine.decompress(token);

	assert.deepEqual(decoded, sample, `${label} should round-trip through web-share engine`);
}

async function runRuntimeSmoke() {
	for (const path of [
		'dist/index.js',
		'dist/index.cjs',
		'dist/index.d.ts',
		'dist/web-share.js',
		'dist/web-share.cjs',
		'dist/web-share.d.ts',
		'dist/browser.js',
		'dist/browser.cjs',
		'dist/browser.d.ts',
		'dist/browser/json-url-single.js'
	]) {
		assertFile(path);
	}

	await assertCodecFactory(unwrapDefault(await import('@firstform/json-url')), 'esm root');
	await assertCodecFactory(unwrapDefault(require('@firstform/json-url')), 'cjs root');
	await assertCodecFactory(unwrapDefault(await import('@firstform/json-url/browser')), 'esm browser');
	await assertCodecFactory(unwrapDefault(require('@firstform/json-url/browser')), 'cjs browser');
	await assertWebShareFactory(
		unwrapDefault(await import('@firstform/json-url/web-share')),
		'esm web-share'
	);
	await assertWebShareFactory(unwrapDefault(require('@firstform/json-url/web-share')), 'cjs web-share');
}

function runTypeSmoke() {
	const tempDir = join(rootDir, '.package-smoke');
	const sourcePath = join(tempDir, 'index.ts');
	const tscPath = require.resolve('typescript/bin/tsc');

	rmSync(tempDir, { recursive: true, force: true });
	mkdirSync(tempDir, { recursive: true });
	writeFileSync(
		sourcePath,
		[
			"import JsonUrl from '@firstform/json-url';",
			"import createWebShareEngine from '@firstform/json-url/web-share';",
			"import BrowserJsonUrl from '@firstform/json-url/browser';",
			'',
			'const codec = JsonUrl<{ ok: boolean }>("raw");',
			'const browserCodec = BrowserJsonUrl<{ ok: boolean }>("raw");',
			'const engine = createWebShareEngine<{ ok: boolean }>({ codecs: ["raw"] });',
			'',
			'const token: string = await codec.compress({ ok: true });',
			'const browserToken: string = await browserCodec.compress({ ok: true });',
			'const engineToken: string = await engine.compress({ ok: true });',
			'',
			'await codec.decompress(token);',
			'await browserCodec.decompress(browserToken);',
			'await engine.decompress(engineToken);'
		].join('\n')
	);

	try {
		execFileSync(
			process.execPath,
			[
				tscPath,
				'--noEmit',
				'--target',
				'ES2020',
				'--module',
				'NodeNext',
				'--moduleResolution',
				'NodeNext',
				'--strict',
				'--skipLibCheck',
				sourcePath
			],
			{ cwd: rootDir, stdio: 'inherit' }
		);
	} finally {
		rmSync(tempDir, { recursive: true, force: true });
	}
}

await runRuntimeSmoke();
runTypeSmoke();
console.log('Package smoke test passed');
