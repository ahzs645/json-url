import type { CodecAlgorithmConfig } from '../types.js';

const pack: CodecAlgorithmConfig = {
	pack: true,
	encode: true,
	async compress(value) {
		return value;
	},
	async decompress(value) {
		return value;
	}
};

export default pack;
