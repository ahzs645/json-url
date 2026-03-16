import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const gz: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return compressTextWithStreamCodec(String(value), 'gzip', 'gz');
	},
	async decompress(buffer) {
		return decompressTextWithStreamCodec(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
			'gzip',
			'gz'
		);
	}
};

export default gz;
