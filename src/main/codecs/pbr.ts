import { compressBytesWithStreamCodec, decompressBytesWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const pbr: CodecAlgorithmConfig = {
	pack: true,
	encode: true,
	async compress(value) {
		return compressBytesWithStreamCodec(
			typeof value === 'string' ? new TextEncoder().encode(value) : value,
			'brotli',
			'pbr'
		);
	},
	async decompress(buffer) {
		return decompressBytesWithStreamCodec(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
			'brotli',
			'pbr'
		);
	}
};

export default pbr;
