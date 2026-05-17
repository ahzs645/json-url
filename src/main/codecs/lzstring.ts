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
		const result = (await loadLzString()).decompressFromUint8Array(
			typeof buffer === 'string' ? new TextEncoder().encode(buffer) : Buffer.from(buffer)
		);
		if (result === null) {
			throw new Error('Unable to decode lzstring codec payload');
		}
		return result;
	}
};

export default lzstring;
