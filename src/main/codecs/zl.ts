import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const zl: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return compressTextWithStreamCodec(String(value), 'deflate', 'zl');
	},
	async decompress(buffer) {
		return decompressTextWithStreamCodec(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
			'deflate',
			'zl'
		);
	}
};

export default zl;
