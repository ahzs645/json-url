import { compressBytesWithStreamCodec, decompressBytesWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const pdf: CodecAlgorithmConfig = {
	pack: true,
	encode: true,
	async compress(value) {
		return compressBytesWithStreamCodec(
			typeof value === 'string' ? new TextEncoder().encode(value) : value,
			'deflate-raw',
			'pdf'
		);
	},
	async decompress(buffer) {
		return decompressBytesWithStreamCodec(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
			'deflate-raw',
			'pdf'
		);
	}
};

export default pdf;
