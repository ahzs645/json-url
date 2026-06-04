import type { CodecAlgorithmConfig } from '../types.js';

const raw: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return typeof value === 'string' ? new TextEncoder().encode(value) : value;
	},
	async decompress(buffer) {
		return typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer);
	}
};

export default raw;
