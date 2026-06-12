import type { JsonUrlValue, NumberPrecisionTransformOptions, ShareTransform } from './types.js';

function isRecord(value: JsonUrlValue): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function roundNumbers(value: JsonUrlValue, decimals: number): JsonUrlValue {
	if (typeof value === 'number') {
		if (!Number.isFinite(value) || Number.isInteger(value)) return value;
		return Number(value.toFixed(decimals));
	}

	if (Array.isArray(value)) {
		return value.map((entry) => roundNumbers(entry, decimals));
	}

	if (isRecord(value)) {
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			result[key] = roundNumbers(value[key], decimals);
		}
		return result;
	}

	return value;
}

export function createNumberPrecisionTransform({
	id = 'number-precision',
	decimals
}: NumberPrecisionTransformOptions): ShareTransform {
	if (!Number.isInteger(decimals) || decimals < 0 || decimals > 15) {
		throw new Error('Number precision transform decimals must be an integer between 0 and 15');
	}

	// Lossy by design: rounding happens before compression and there is no
	// information left to restore on decode, so no decode handler is provided.
	return {
		id,
		encode(value) {
			return roundNumbers(value, decimals);
		}
	};
}
