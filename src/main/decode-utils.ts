import type { DecodeOptions } from './types.js';

interface CleanEncodedInputOptions {
	decode?: boolean;
	space?: 'strip' | 'preserve' | 'plus';
}

function isIgnorableCodePoint(codePoint: number): boolean {
	return (
		codePoint === 9 ||
		codePoint === 10 ||
		codePoint === 11 ||
		codePoint === 12 ||
		codePoint === 13 ||
		codePoint === 0 ||
		codePoint === 160 ||
		codePoint === 8232 ||
		codePoint === 8233
	);
}

export function cleanEncodedInput(str: string, options: CleanEncodedInputOptions = {}): string {
	const shouldDecode = options.decode !== false;
	const decoded = shouldDecode && str.indexOf('%') >= 0 ? decodeURIComponent(str) : str;
	const spaceMode = options.space ?? 'strip';

	let out = '';
	let i = 0;
	let j = 0;

	while (i < decoded.length) {
		const codePoint = decoded.charCodeAt(i);
		if (codePoint === 32 && spaceMode === 'preserve') {
			i += 1;
			continue;
		}

		if (codePoint === 32 || isIgnorableCodePoint(codePoint)) {
			if (i > j) out += decoded.slice(j, i);
			if (codePoint === 32 && spaceMode === 'plus') out += '+';
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

export function prepareEncodedInput(
	input: string,
	options: DecodeOptions = {},
	cleanOptions?: CleanEncodedInputOptions
): string {
	if (typeof input !== 'string') {
		throw new Error('Expected encoded input to be a string');
	}

	const { deURI } = normalizeDecodeOptions(options);
	return deURI ? cleanEncodedInput(input, cleanOptions) : input;
}
