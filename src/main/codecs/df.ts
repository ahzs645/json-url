import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const df: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return compressTextWithStreamCodec(String(value), 'deflate-raw', 'df');
	},
	async decompress(buffer) {
		return decompressTextWithStreamCodec(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
			'deflate-raw',
			'df'
		);
	}
};

export default df;
