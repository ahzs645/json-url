import LOADERS from '../loaders.js';
import type { CodecAlgorithmConfig } from '../types.js';

const lz: CodecAlgorithmConfig = {
	pack: false,
	encode: false,
	async compress(value) {
		return (await LOADERS.lzstring()).compressToEncodedURIComponent(String(value));
	},
	async decompress(value) {
		const result = (await LOADERS.lzstring()).decompressFromEncodedURIComponent(String(value));
		if (result === null) {
			throw new Error('Unable to decode lz codec payload');
		}
		return result;
	}
};

export default lz;
