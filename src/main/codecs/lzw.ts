import { Buffer } from 'buffer';

import LOADERS from '../loaders.js';
import type { CodecAlgorithmConfig } from '../types.js';

const lzw: CodecAlgorithmConfig = {
	pack: true,
	encode: true,
	async compress(input) {
		const bytes = Buffer.from(input);
		return Buffer.from((await LOADERS.lzw()).encode(bytes.toString('binary')));
	},
	async decompress(input) {
		return Buffer.from((await LOADERS.lzw()).decode(Buffer.from(input)), 'binary');
	}
};

export default lzw;
