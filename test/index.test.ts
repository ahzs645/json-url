import { Buffer } from 'buffer';
import { describe, expect, it } from 'vitest';
import { validate } from 'urlsafe-base64';

import createClient from '../src/main/index.js';
import { cleanEncodedInput } from '../src/main/decode-utils.js';
import samples from './samples.json';

describe('edge cases', () => {
	const algorithms = ['pack', 'lzw', 'lzma', 'lzstring'] as const;

	it('handles an empty object', async () => {
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress({});
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual({});
		}
	});

	it('handles an empty array', async () => {
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress([]);
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual([]);
		}
	});

	it('handles deeply nested objects', async () => {
		let nested: Record<string, unknown> = { value: 'leaf' };
		for (let i = 0; i < 20; i++) {
			nested = { child: nested };
		}
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress(nested);
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual(nested);
		}
	});

	it('handles special Unicode characters', async () => {
		const data = {
			emoji: '\u{1F600}\u{1F680}\u{1F30D}',
			cjk: '\u4F60\u597D\u4E16\u754C',
			arabic: '\u0645\u0631\u062D\u0628\u0627',
			mixed: 'hello \u4E16\u754C \u{1F600}'
		};
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress(data);
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual(data);
		}
	});

	it('handles values with special JSON types', async () => {
		const data = {
			nullValue: null,
			boolTrue: true,
			boolFalse: false,
			zero: 0,
			negative: -42,
			float: 3.14159,
			emptyString: '',
			emptyArray: [],
			emptyObject: {}
		};
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress(data);
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual(data);
		}
	});

	it('handles a large payload', async () => {
		const largeArray = Array.from({ length: 500 }, (_, i) => ({
			id: i,
			name: `item-${i}`,
			active: i % 2 === 0
		}));
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress(largeArray);
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual(largeArray);
		}
	});

	it('handles strings with URL-unsafe characters', async () => {
		const data = {
			url: 'https://example.com/path?q=hello+world&foo=bar#section',
			encoded: '%20%3D%26',
			slashes: '////',
			plus: 'a+b+c'
		};
		for (const alg of algorithms) {
			const client = createClient(alg);
			const compressed = await client.compress(data);
			expect(validate(compressed)).toBe(true);
			const decompressed = await client.decompress(compressed);
			expect(decompressed).toEqual(data);
		}
	});
});

describe('json-url', () => {
	for (const sample of samples) {
		describe(`When attempting to compress ${JSON.stringify(sample).slice(0, 50)}...`, () => {
			for (const algorithm of ['pack', 'lzw', 'lzma', 'lzstring']) {
				describe(`using the ${algorithm} algorithm`, () => {
					const client = createClient(algorithm);

					it('compresses JSON via #compress to base64 format', async () => {
						const compressed = await client.compress(sample);
						expect(validate(compressed)).toBe(true);
					});

					it('can decompress JSON compressed via #compress using #decompress', async () => {
						const compressed = await client.compress(sample);
						const decompressed = await client.decompress(compressed);
						expect(decompressed).toEqual(sample);
					});

					it('returns stats { rawencoded, compressedencoded, compression } via #stats', async () => {
						const result = await client.stats(sample);
						expect(result.rawencoded).toBeTruthy();
						expect(result.compressedencoded).toBeTruthy();
						expect(result.compression).toBeTruthy();
					});
				});
			}
		});
	}
});

describe('json-url engine', () => {
	it('exposes engine helpers on the default export', () => {
		expect(Array.isArray(createClient.availableCodecs)).toBe(true);
		expect(createClient.availableCodecs).toContain('hgz');
		expect(createClient.availableCodecs).toContain('hbr');
		expect(typeof createClient.createEngine).toBe('function');
		expect(typeof createClient.createNamedCodec).toBe('function');
		expect(typeof createClient.createWebShareEngine).toBe('function');
	});

	it('supports the built-in web share codecs', async () => {
		const sample = {
			builderName: 'Untitled',
			builderFields: [{ id: 'q1', type: 'text', label: 'Name' }],
			layoutDrafts: []
		};

		for (const algorithm of ['raw', 'gz', 'df', 'br', 'lz']) {
			const codec = createClient(algorithm);
			const token = await codec.compress(sample);
			const decompressed = await codec.decompress(token);

			expect(decompressed).toEqual(sample);
			if (algorithm !== 'lz') {
				expect(validate(token)).toBe(true);
			}
		}
	});

	it('can clean URI-encoded or whitespace-polluted tokens on decode', async () => {
		const engine = createClient.createWebShareEngine();
		const sample = {
			builderName: 'Untitled',
			builderFields: [{ id: 'q1', type: 'text', label: 'Name' }]
		};
		const detailed = await engine.compressDetailed(sample);
		const dirtyToken = ` \n${encodeURIComponent(detailed.token)} \r`;

		const decoded = await engine.decompress(dirtyToken, { deURI: true });
		expect(decoded).toEqual(sample);
	});

	it('applies transforms for the single-codec client API', async () => {
		const codec = createClient('lzstring', {
			transforms: [
				{
					id: 'wrap',
					encode: (value) => ({ payload: value, compacted: true }),
					decode: (value) => (value as { payload: unknown }).payload
				}
			]
		});
		const sample = {
			hotspot: { mapLibraryId: 'homunculus_joint_selection' },
			flags: [true, false]
		};
		const compressed = await codec.compress(sample);
		const decompressed = await codec.decompress(compressed);
		const stats = await codec.stats(sample);

		expect(decompressed).toEqual(sample);
		expect(stats.transforms).toEqual(['wrap']);
	});

	it('can encode known payloads as compact reference transforms', async () => {
		const preset = {
			builderName: 'MoCA Blind',
			builderFields: [
				{ id: 'section', type: 'section', label: 'MoCA Blind' },
				{ id: 'score', type: 'number', label: 'Score' }
			],
			layoutDrafts: []
		};
		const editedPreset = {
			...preset,
			builderName: 'MoCA Blind Edited'
		};
		const engine = createClient.createWebShareEngine<typeof preset>({
			codecs: ['raw'],
			transforms: [
				createClient.createReferenceTransform({
					id: 'fixture-ref',
					refKey: 'fixture',
					entries: [{ key: 'moca-blind', value: preset }]
				})
			]
		});

		const referenced = await engine.compressDetailed(preset);
		const edited = await engine.compressDetailed(editedPreset);
		const decoded = await engine.decompress(referenced.token);

		expect(referenced.transformed).toBe(JSON.stringify({ fixture: 'moca-blind' }).length);
		expect(referenced.compressedencoded).toBeLessThan(edited.compressedencoded);
		expect(decoded).toEqual(preset);
	});

	it('throws when a reference transform cannot resolve a key', async () => {
		const codec = createClient('raw', {
			transforms: [
				createClient.createReferenceTransform({
					entries: [{ key: 'known', value: { ok: true } }]
				})
			]
		});
		const token = await createClient('raw').compress({ $ref: 'missing' });

		await expect(codec.decompress(token)).rejects.toThrow(/Unknown reference transform key/);
	});

	it('provides tryDecompress fallbacks for codec clients', async () => {
		const codec = createClient<{ fallback: boolean }>('raw');
		const decoded = await codec.tryDecompress('%7Bbad', { fallback: true }, { deURI: true });

		expect(decoded).toEqual({ fallback: true });
	});

	it('selects the shortest codec candidate and decodes prefixed tokens', async () => {
		const sample = { embedded: { id: 'asset_1', payload: 'very large thing' } };
		const shortCodec = {
			id: 'short',
			async compress(value: unknown) {
				return `s${Buffer.from(JSON.stringify(value)).toString('base64')}`;
			},
			async decompress(token: string) {
				return JSON.parse(Buffer.from(token.slice(1), 'base64').toString('utf8'));
			}
		};
		const longCodec = {
			id: 'verylong',
			async compress(value: unknown) {
				return `this-is-a-much-longer-token:${Buffer.from(JSON.stringify(value)).toString('base64')}`;
			},
			async decompress(token: string) {
				return JSON.parse(
					Buffer.from(token.slice('this-is-a-much-longer-token:'.length), 'base64').toString(
						'utf8'
					)
				);
			}
		};
		const engine = createClient.createEngine({
			codecs: [longCodec, shortCodec],
			transforms: [
				{
					id: 'stable-ref',
					encode: (value) => {
						const input = value as { embedded: { id: string } };
						return {
							...input,
							embedded: { ref: input.embedded.id }
						};
					},
					decode: (value) => {
						const input = value as { embedded: { ref: string } };
						return {
							...input,
							embedded: { id: input.embedded.ref, payload: 'resolved' }
						};
					}
				}
			]
		});

		const detailed = await engine.compressDetailed(sample);
		const decompressed = await engine.decompress(detailed.token);

		expect(detailed.codec).toBe('short');
		expect(detailed.token.startsWith('1.short.')).toBe(true);
		expect(decompressed).toEqual({
			embedded: { id: 'asset_1', payload: 'resolved' }
		});
		expect(detailed.candidates).toHaveLength(2);
		expect(detailed.candidates[0].tokenLength).toBeLessThanOrEqual(
			detailed.candidates[1].tokenLength
		);
	});

	it('rejects ambiguous unprefixed tokens for multi-codec engines', async () => {
		const engine = createClient.createEngine({
			codecs: [
				{
					id: 'a',
					async compress(value: unknown) {
						return JSON.stringify(value);
					},
					async decompress(token: string) {
						return JSON.parse(token);
					}
				},
				{
					id: 'b',
					async compress(value: unknown) {
						return JSON.stringify(value);
					},
					async decompress(token: string) {
						return JSON.parse(token);
					}
				}
			]
		});

		await expect(engine.decompress('{"ok":true}')).rejects.toThrow(
			/missing a version\/codec prefix/
		);
	});

	it('creates a web share engine with prefixed default codecs and a max length', async () => {
		const engine = createClient.createWebShareEngine();
		const decodedSample = {
			builderName: 'Untitled',
			builderFields: [{ id: 'q1', type: 'text', label: 'Name' }]
		};
		const detailed = await engine.compressDetailed(decodedSample);
		const decoded = await engine.decompress(detailed.token);

		expect(engine.codecs).toEqual(['raw', 'gz', 'df', 'zl', 'br', 'lz']);
		expect(engine.version).toBe('1');
		expect(engine.skipUnsupportedCodecs).toBe(true);
		expect(detailed.token.startsWith('1.')).toBe(true);
		expect(detailed.compressedencoded).toBeLessThanOrEqual(12000);
		expect(decoded).toEqual(decodedSample);
	});

	it('provides tryDecodeToken fallbacks for engine clients', async () => {
		const engine = createClient.createWebShareEngine<{ fallback: boolean }>();
		const decoded = await engine.tryDecodeToken('%7Bbad', { fallback: true }, { deURI: true });

		expect(decoded).toEqual({ fallback: true });
	});
});

describe('homogeneous codecs', () => {
	for (const algorithm of ['hgz', 'hbr'] as const) {
		it(`round-trips homogeneous object arrays with ${algorithm}`, async () => {
			const codec = createClient(algorithm);
			const sample = Array.from({ length: 60 }, (_, index) => ({
				id: index,
				label: `Item ${index}`,
				active: index % 2 === 0,
				nested: {
					fields: Array.from({ length: 3 }, (__, childIndex) => ({
						name: `field-${childIndex}`,
						value: `${index}-${childIndex}`
					}))
				}
			}));

			const compressed = await codec.compress(sample);
			const decompressed = await codec.decompress(compressed);

			expect(validate(compressed)).toBe(true);
			expect(decompressed).toEqual(sample);
		});

		it(`does not corrupt heterogeneous arrays with ${algorithm}`, async () => {
			const codec = createClient(algorithm);
			const sample = {
				rows: [{ a: 1, b: 2 }, { a: 3, c: 5 }],
				mixed: [{ a: 1 }, 2, { a: 3 }],
				primitives: [1, 2, 3],
				oneItem: [{ only: true }],
				zeroKeyRows: Array.from({ length: 5 }, () => ({}))
			};

			const compressed = await codec.compress(sample);
			const decompressed = await codec.decompress(compressed);

			expect(decompressed).toEqual(sample);
		});

		it(`supports keys containing dots or slashes with ${algorithm}`, async () => {
			const codec = createClient(algorithm);
			const sample = {
				'field.with.dot': [
					{
						'value/one': [
							{ 'nested.key': 'a', 'nested/slash': 1 },
							{ 'nested.key': 'b', 'nested/slash': 2 }
						]
					},
					{
						'value/one': [
							{ 'nested.key': 'c', 'nested/slash': 3 },
							{ 'nested.key': 'd', 'nested/slash': 4 }
						]
					}
				]
			};

			const compressed = await codec.compress(sample);
			const decompressed = await codec.decompress(compressed);

			expect(decompressed).toEqual(sample);
		});
	}

	it('lets the engine prefer hgz over gz when packing helps', async () => {
		const engine = createClient.createEngine({
			codecs: ['gz', 'hgz']
		});
		const sample = Array.from({ length: 100 }, (_, index) => ({
			id: index,
			name: `item-${index}`,
			active: index % 2 === 0,
			tags: ['a', 'b', 'c']
		}));

		const detailed = await engine.compressDetailed(sample);
		const decompressed = await engine.decompress(detailed.token);

		expect(detailed.codec).toBe('hgz');
		expect(decompressed).toEqual(sample);
	});
});

describe('cleanEncodedInput', () => {
	it('strips whitespace characters', () => {
		expect(cleanEncodedInput(' hello ')).toBe('hello');
		expect(cleanEncodedInput('\nhello\r')).toBe('hello');
		expect(cleanEncodedInput('\0hello\0')).toBe('hello');
	});

	it('strips unicode line/paragraph separators', () => {
		expect(cleanEncodedInput('\u2028hello\u2029')).toBe('hello');
	});

	it('decodes percent-encoded segments and strips resulting whitespace', () => {
		expect(cleanEncodedInput('hello%20world')).toBe('helloworld');
		expect(cleanEncodedInput('hello%2Dworld')).toBe('hello-world');
	});

	it('handles multiple percent-encoded segments efficiently', () => {
		expect(cleanEncodedInput('%48%65%6C%6C%6F')).toBe('Hello');
	});

	it('handles mixed percent-encoding and whitespace', () => {
		expect(cleanEncodedInput(' %48ello \n')).toBe('Hello');
		expect(cleanEncodedInput('%61%62%63')).toBe('abc');
	});

	it('returns the input unchanged when clean', () => {
		expect(cleanEncodedInput('abc123')).toBe('abc123');
	});
});

describe('error paths', () => {
	it('throws on invalid codec algorithm', () => {
		expect(() => createClient('nonexistent')).toThrow('No such algorithm');
	});

	it('throws on empty token for decompress', async () => {
		const codec = createClient('raw');
		await expect(codec.decompress('')).rejects.toThrow();
	});

	it('throws on unsupported token version in engine decompress', async () => {
		const engine = createClient.createWebShareEngine();
		await expect(engine.decompress('99.gz.payload')).rejects.toThrow(/Unsupported token version/);
	});

	it('throws on unsupported codec in engine decompress', async () => {
		const engine = createClient.createWebShareEngine();
		await expect(engine.decompress('1.nonexistent.payload')).rejects.toThrow(/Unsupported codec/);
	});

	it('throws on duplicate codec ids in engine', () => {
		expect(() =>
			createClient.createEngine({ codecs: ['gz', 'gz'] })
		).toThrow(/Duplicate codec id/);
	});

	it('throws on invalid maxLength', () => {
		expect(() =>
			createClient.createEngine({ codecs: ['raw'], maxLength: -1 })
		).toThrow(/positive finite number/);
	});

	it('throws when encoded token exceeds maxLength', async () => {
		const engine = createClient.createEngine({
			codecs: ['raw'],
			maxLength: 5
		});
		await expect(engine.compress({ key: 'value' })).rejects.toThrow(/exceeds maxLength/);
	});
});

describe('compressConditional and plainTextThreshold', () => {
	it('returns null when raw encoded size is within threshold', async () => {
		const engine = createClient.createEngine({
			codecs: ['raw'],
			plainTextThreshold: 100000
		});
		const result = await engine.compressConditional({ small: true });
		expect(result).toBeNull();
	});

	it('compresses when raw encoded size exceeds threshold', async () => {
		const engine = createClient.createEngine({
			codecs: ['raw'],
			plainTextThreshold: 5
		});
		const result = await engine.compressConditional({ data: 'this is a longer payload' });
		expect(result).not.toBeNull();
		expect(typeof result).toBe('string');
	});

	it('always compresses when plainTextThreshold is not set', async () => {
		const engine = createClient.createEngine({ codecs: ['raw'] });
		const result = await engine.compressConditional({ tiny: 1 });
		expect(result).not.toBeNull();
	});
});

describe('zl (deflate) codec', () => {
	it('round-trips data with the zl codec', async () => {
		const codec = createClient('zl');
		const sample = { deflate: true, nested: { values: [1, 2, 3] } };
		const compressed = await codec.compress(sample);
		const decompressed = await codec.decompress(compressed);

		expect(validate(compressed)).toBe(true);
		expect(decompressed).toEqual(sample);
	});

	it('produces stats for the zl codec', async () => {
		const codec = createClient('zl');
		const stats = await codec.stats({ test: 'value' });

		expect(stats.rawencoded).toBeTruthy();
		expect(stats.compressedencoded).toBeTruthy();
		expect(stats.compression).toBeTruthy();
		expect(stats.algorithm).toBe('zl');
	});
});

describe('maxDecompressedSize guard', () => {
	it('rejects decompressed payloads exceeding the limit for named codec', async () => {
		const codec = createClient('raw', { maxDecompressedSize: 10 });
		const largePayload = { data: 'this string is definitely longer than 10 bytes' };
		const compressed = await codec.compress(largePayload);

		await expect(codec.decompress(compressed)).rejects.toThrow(/exceeds maxDecompressedSize/);
	});

	it('allows decompressed payloads within the limit for named codec', async () => {
		const codec = createClient('raw', { maxDecompressedSize: 100000 });
		const sample = { ok: true };
		const compressed = await codec.compress(sample);
		const decompressed = await codec.decompress(compressed);

		expect(decompressed).toEqual(sample);
	});

	it('rejects decompressed payloads exceeding the limit for engine', async () => {
		const engine = createClient.createEngine({
			codecs: ['raw'],
			maxDecompressedSize: 10
		});
		const largePayload = { data: 'this is too large for the limit' };
		const compressed = await engine.compress(largePayload);

		await expect(engine.decompress(compressed)).rejects.toThrow(/exceeds maxDecompressedSize/);
	});

	it('allows decompressed payloads within the limit for engine', async () => {
		const engine = createClient.createEngine({
			codecs: ['raw'],
			maxDecompressedSize: 100000
		});
		const sample = { ok: true };
		const compressed = await engine.compress(sample);
		const decompressed = await engine.decompress(compressed);

		expect(decompressed).toEqual(sample);
	});

	it('returns fallback via tryDecompress when size limit exceeded', async () => {
		const codec = createClient<{ fallback: boolean }>('raw', { maxDecompressedSize: 10 });
		const largePayload = { data: 'too large for the size limit' };
		const compressed = await codec.compress(largePayload as never);

		const result = await codec.tryDecompress(compressed, { fallback: true });
		expect(result).toEqual({ fallback: true });
	});
});

describe('engine stats', () => {
	it('returns detailed stats from the engine stats method', async () => {
		const engine = createClient.createWebShareEngine();
		const sample = { test: 'data', count: 42 };
		const stats = await engine.stats(sample);

		expect(stats.codec).toBeTruthy();
		expect(stats.token).toBeTruthy();
		expect(stats.raw).toBeGreaterThan(0);
		expect(stats.rawencoded).toBeGreaterThan(0);
		expect(stats.compressedencoded).toBeGreaterThan(0);
		expect(stats.compression).toBeGreaterThan(0);
		expect(Array.isArray(stats.candidates)).toBe(true);
		expect(stats.candidates.length).toBeGreaterThan(0);
	});
});

describe('single-codec engine without prefix', () => {
	it('omits prefix for single-codec engines when alwaysPrefix is false', async () => {
		const engine = createClient.createEngine({
			codecs: ['raw'],
			alwaysPrefix: false
		});
		const sample = { single: true };
		const compressed = await engine.compress(sample);

		expect(compressed.startsWith('1.')).toBe(false);
		const decompressed = await engine.decompress(compressed);
		expect(decompressed).toEqual(sample);
	});
});

describe('custom codec in engine', () => {
	it('works with a custom codec that uses JSON + base64', async () => {
		const engine = createClient.createEngine({
			codecs: [
				{
					id: 'custom',
					async compress(value: unknown) {
						return Buffer.from(JSON.stringify(value)).toString('base64');
					},
					async decompress(token: string) {
						return JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
					}
				}
			]
		});

		const sample = { custom: true, data: [1, 2, 3] };
		const compressed = await engine.compress(sample);
		const decompressed = await engine.decompress(compressed);

		expect(decompressed).toEqual(sample);
	});
});
