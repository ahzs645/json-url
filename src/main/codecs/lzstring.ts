import { Buffer } from 'buffer';

import LOADERS from '../loaders.js';
import type { CodecAlgorithmConfig } from '../types.js';

const lzstring: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return Buffer.from((await LOADERS.lzstring()).compressToUint8Array(String(value)));
	},
	async decompress(buffer) {
		return (await LOADERS.lzstring()).decompressFromUint8Array(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : Buffer.from(buffer)
		);
	}
};

export default lzstring;
