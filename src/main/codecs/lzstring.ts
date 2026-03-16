import { Buffer } from 'buffer';

import { loadLzString } from '../load-lzstring.js';
import type { CodecAlgorithmConfig } from '../types.js';

const lzstring: CodecAlgorithmConfig = {
	pack: false,
	encode: true,
	async compress(value) {
		return Buffer.from((await loadLzString()).compressToUint8Array(String(value)));
	},
	async decompress(buffer) {
		return (await loadLzString()).decompressFromUint8Array(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : Buffer.from(buffer)
		);
	}
};

export default lzstring;
