import { Buffer } from 'buffer';

import { loadLzma } from '../load-lzma.js';
import type { CodecAlgorithmConfig } from '../types.js';

const lzma: CodecAlgorithmConfig = {
	pack: true,
	encode: true,
	async compress(input) {
		const value = Buffer.from(input);
		const api = await loadLzma();

		return new Promise<Uint8Array>((resolve, reject) => {
			api.compress(value, 9, (byteArray, error) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(Buffer.from(byteArray));
			});
		});
	},
	async decompress(input) {
		const value = Buffer.from(input);
		const api = await loadLzma();

		return new Promise<Uint8Array>((resolve, reject) => {
			api.decompress(value, (byteArray, error) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(Buffer.from(byteArray));
			});
		});
	}
};

export default lzma;
