import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

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

function assertLiteFactory(factory, label) {
	for (const codec of ['raw', 'gz', 'hgz', 'df', 'zl', 'br', 'hbr', 'lz']) {
		assert.ok(factory.availableCodecs.includes(codec), `${label} should include ${codec}`);
	}

	for (const codec of ['lzma', 'lzstring', 'lzw', 'pack']) {
		assert.ok(!factory.availableCodecs.includes(codec), `${label} should exclude ${codec}`);
		assert.throws(() => factory(codec), /No such algorithm/, `${label} should reject ${codec}`);
	}
}

function assertLiteBundleBoundary() {
	const full = readFileSync(join(rootDir, 'dist/browser/json-url-single.js'));
	const lite = readFileSync(join(rootDir, 'dist/browser/json-url-lite.js'));
	const liteText = lite.toString('utf8');
	const liteGzipSize = gzipSync(lite).length;

	assert.ok(lite.length < full.length, 'Lite browser bundle should be smaller than full bundle');
	assert.ok(
		liteGzipSize < gzipSync(full).length,
		'Gzipped lite browser bundle should be smaller than full bundle'
	);
	assert.ok(lite.length < 80_000, 'Lite browser bundle should stay below 80 kB');
	assert.ok(liteGzipSize < 20_000, 'Gzipped lite browser bundle should stay below 20 kB');

	for (const marker of ['msgpack5', 'node-lzw', 'lzma_worker']) {
		assert.ok(!liteText.includes(marker), `Lite browser bundle should not include ${marker}`);
	}
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
		'dist/browser-lite.js',
		'dist/browser-lite.cjs',
		'dist/browser-lite.d.ts',
		'dist/browser/json-url-single.js',
		'dist/browser/json-url-lite.js'
	]) {
		assertFile(path);
	}

	await assertCodecFactory(unwrapDefault(await import('@firstform/json-url')), 'esm root');
	await assertCodecFactory(unwrapDefault(require('@firstform/json-url')), 'cjs root');
	await assertCodecFactory(unwrapDefault(await import('@firstform/json-url/browser')), 'esm browser');
	await assertCodecFactory(unwrapDefault(require('@firstform/json-url/browser')), 'cjs browser');
	const browserLiteEsm = unwrapDefault(await import('@firstform/json-url/browser-lite'));
	const browserLiteCjs = unwrapDefault(require('@firstform/json-url/browser-lite'));
	await assertCodecFactory(browserLiteEsm, 'esm browser-lite');
	await assertCodecFactory(browserLiteCjs, 'cjs browser-lite');
	assertLiteFactory(browserLiteEsm, 'esm browser-lite');
	assertLiteFactory(browserLiteCjs, 'cjs browser-lite');
	await assertWebShareFactory(
		unwrapDefault(await import('@firstform/json-url/web-share')),
		'esm web-share'
	);
	await assertWebShareFactory(unwrapDefault(require('@firstform/json-url/web-share')), 'cjs web-share');
	assertLiteBundleBoundary();
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
			"import BrowserLiteJsonUrl from '@firstform/json-url/browser-lite';",
			'',
			'const codec = JsonUrl<{ ok: boolean }>("raw");',
			'const browserCodec = BrowserJsonUrl<{ ok: boolean }>("raw");',
			'const browserLiteCodec = BrowserLiteJsonUrl<{ ok: boolean }>("raw");',
			'const engine = createWebShareEngine<{ ok: boolean }>({ codecs: ["raw"] });',
			'const browserLiteEngine = BrowserLiteJsonUrl.createWebShareEngine<{ ok: boolean }>({ codecs: ["raw"] });',
			'',
			'const token: string = await codec.compress({ ok: true });',
			'const browserToken: string = await browserCodec.compress({ ok: true });',
			'const browserLiteToken: string = await browserLiteCodec.compress({ ok: true });',
			'const engineToken: string = await engine.compress({ ok: true });',
			'const browserLiteEngineToken: string = await browserLiteEngine.compress({ ok: true });',
			'',
			'await codec.decompress(token);',
			'await browserCodec.decompress(browserToken);',
			'await browserLiteCodec.decompress(browserLiteToken);',
			'await engine.decompress(engineToken);',
			'await browserLiteEngine.decompress(browserLiteEngineToken);'
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
