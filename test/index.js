/* global describe, it */
import assert from 'assert';
import createClient from 'main';
import { validate } from 'urlsafe-base64';
import samples from './samples.json'

describe('json-url', () => {
	samples.forEach(sample => {
		describe(`When attempting to compress ${JSON.stringify(sample).slice(0, 50)}...`, () => {
			['pack', 'lzw', 'lzma', 'lzstring'].forEach(algorithm => {
				describe(`using the ${algorithm} algorithm`, () => {
					const client = createClient(algorithm);

					it('compresses JSON via #compress to base64 format', async () => {
						const compressed = await client.compress(sample);
						assert.ok(validate(compressed), `${compressed} is not valid base64`);
					});

					it('can decompress JSON compressed via #compress using #decompress', async () => {
						const compressed = await client.compress(sample);
						const decompressed = await client.decompress(compressed);
						assert.equal(JSON.stringify(decompressed), JSON.stringify(sample));
					});

					it('returns stats { rawencoded, compressedencoded, compression } via #stats', async () => {
						const result = await client.stats(sample);
						assert.ok(result['rawencoded']);
						assert.ok(result['compressedencoded']);
						assert.ok(result['compression']);
					});
				}); // each algorithm
			});
		}); // each sample
	});
});

describe('json-url engine', () => {
	it('exposes engine helpers on the default export', () => {
		assert.ok(Array.isArray(createClient.availableCodecs));
		assert.equal(typeof createClient.createEngine, 'function');
		assert.equal(typeof createClient.createNamedCodec, 'function');
	});

	it('applies transforms for the single-codec client API', async () => {
		const codec = createClient('lzstring', {
			transforms: [
				{
					id: 'wrap',
					encode: value => ({ payload: value, compacted: true }),
					decode: value => value.payload
				}
			]
		});
		const sample = { hotspot: { mapLibraryId: 'homunculus_joint_selection' }, flags: [true, false] };
		const compressed = await codec.compress(sample);
		const decompressed = await codec.decompress(compressed);
		const stats = await codec.stats(sample);

		assert.equal(JSON.stringify(decompressed), JSON.stringify(sample));
		assert.deepEqual(stats.transforms, ['wrap']);
	});

	it('selects the shortest codec candidate and decodes prefixed tokens', async () => {
		const sample = { embedded: { id: 'asset_1', payload: 'very large thing' } };
		const shortCodec = {
			id: 'short',
			async compress(value) {
				return `s${Buffer.from(JSON.stringify(value)).toString('base64')}`;
			},
			async decompress(token) {
				return JSON.parse(Buffer.from(token.slice(1), 'base64').toString('utf8'));
			}
		};
		const longCodec = {
			id: 'verylong',
			async compress(value) {
				return `this-is-a-much-longer-token:${Buffer.from(JSON.stringify(value)).toString('base64')}`;
			},
			async decompress(token) {
				return JSON.parse(Buffer.from(token.slice('this-is-a-much-longer-token:'.length), 'base64').toString('utf8'));
			}
		};
		const engine = createClient.createEngine({
			codecs: [longCodec, shortCodec],
			transforms: [
				{
					id: 'stable-ref',
					encode: value => ({
						...value,
						embedded: { ref: value.embedded.id }
					}),
					decode: value => ({
						...value,
						embedded: { id: value.embedded.ref, payload: 'resolved' }
					})
				}
			]
		});

		const detailed = await engine.compressDetailed(sample);
		const decompressed = await engine.decompress(detailed.token);

		assert.equal(detailed.codec, 'short');
		assert.ok(detailed.token.startsWith('1.short.'));
		assert.equal(JSON.stringify(decompressed), JSON.stringify({
			embedded: { id: 'asset_1', payload: 'resolved' }
		}));
		assert.equal(detailed.candidates.length, 2);
		assert.ok(detailed.candidates[0].tokenLength <= detailed.candidates[1].tokenLength);
	});

	it('rejects ambiguous unprefixed tokens for multi-codec engines', async () => {
		const engine = createClient.createEngine({
			codecs: [
				{
					id: 'a',
					async compress(value) {
						return JSON.stringify(value);
					},
					async decompress(token) {
						return JSON.parse(token);
					}
				},
				{
					id: 'b',
					async compress(value) {
						return JSON.stringify(value);
					},
					async decompress(token) {
						return JSON.parse(token);
					}
				}
			]
		});

		await assert.rejects(() => engine.decompress('{"ok":true}'), /missing a version\/codec prefix/);
	});
});
