import { describe, expect, it } from 'vitest';
import { validate } from 'urlsafe-base64';

import createClient from '../src/main/index.js';
import samples from './samples.json';

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

		expect(engine.codecs).toEqual(['raw', 'gz', 'df', 'br', 'lz']);
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
