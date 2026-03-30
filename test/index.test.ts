import { describe, expect, it } from 'vitest';
import { validate } from 'urlsafe-base64';

import createClient from '../src/main/index.js';
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
