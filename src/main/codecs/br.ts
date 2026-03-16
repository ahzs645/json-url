import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const br: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return compressTextWithStreamCodec(String(value), 'brotli', 'br');
	},
	async decompress(buffer) {
		return decompressTextWithStreamCodec(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
			'brotli',
			'br'
		);
	}
};

export default br;
