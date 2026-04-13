import type { DecodeOptions } from './types.js';

export function cleanEncodedInput(str: string): string {
	const decoded = str.indexOf('%') >= 0 ? decodeURIComponent(str) : str;

	let out = '';
	let i = 0;
	let j = 0;

	while (i < decoded.length) {
		const codePoint = decoded.charCodeAt(i);
		if (
			codePoint === 32 ||
			codePoint === 10 ||
			codePoint === 13 ||
			codePoint === 0 ||
			codePoint === 8232 ||
			codePoint === 8233
		) {
			if (i > j) out += decoded.slice(j, i);
			i += 1;
			j = i;
		} else {
			i += 1;
		}
	}

	if (i > j) out += decoded.slice(j, i);
	return out;
}

export function normalizeDecodeOptions(options: DecodeOptions = {}): Required<DecodeOptions> {
	if (!options || typeof options !== 'object' || Array.isArray(options)) {
		throw new Error('Expected decode options to be an object');
	}

	return {
		deURI: options.deURI === true
	};
}

export function prepareEncodedInput(input: string, options: DecodeOptions = {}): string {
	if (typeof input !== 'string') {
		throw new Error('Expected encoded input to be a string');
	}

	const { deURI } = normalizeDecodeOptions(options);
	return deURI ? cleanEncodedInput(input) : input;
}
