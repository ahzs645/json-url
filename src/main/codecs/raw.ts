import { Buffer } from 'buffer';

import type { CodecAlgorithmConfig } from '../types.js';

const raw: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return Buffer.from(
			typeof value === 'string' ? value : Buffer.from(value).toString('utf8'),
			'utf8'
		);
	},
	async decompress(buffer) {
		return Buffer.from(
			typeof buffer === 'string' ? Buffer.from(buffer, 'utf8') : buffer
		).toString('utf8');
	}
};

export default raw;
