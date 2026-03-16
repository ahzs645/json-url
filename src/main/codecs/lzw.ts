import { Buffer } from 'buffer';

import { loadLzw } from '../load-lzw.js';
import type { CodecAlgorithmConfig } from '../types.js';

const lzw: CodecAlgorithmConfig = {
	pack: true,
	encode: true,
	async compress(input) {
		const bytes = Buffer.from(input);
		return Buffer.from((await loadLzw()).encode(bytes.toString('binary')));
	},
	async decompress(input) {
		return Buffer.from((await loadLzw()).decode(Buffer.from(input)), 'binary');
	}
};

export default lzw;
