import type { JsonUrlValue, KeyMapTransformOptions, ShareTransform } from './types.js';

function isRecord(value: JsonUrlValue): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function renameKeys(
	value: JsonUrlValue,
	map: Map<string, string>,
	transformId: string
): JsonUrlValue {
	if (Array.isArray(value)) {
		return value.map((entry) => renameKeys(entry, map, transformId));
	}

	if (!isRecord(value)) {
		return value;
	}

	const sourceKeys = Object.keys(value);
	const renamed = sourceKeys.map((key) => map.get(key) ?? key);
	const seen = new Set<string>();

	for (let i = 0; i < renamed.length; i++) {
		if (seen.has(renamed[i])) {
			throw new Error(
				`Key map transform "${transformId}" produced duplicate key "${renamed[i]}"`
			);
		}
		seen.add(renamed[i]);
	}

	const result: Record<string, unknown> = {};
	for (let i = 0; i < sourceKeys.length; i++) {
		result[renamed[i]] = renameKeys(value[sourceKeys[i]], map, transformId);
	}
	return result;
}

export function createKeyMapTransform({
	id = 'key-map',
	keys
}: KeyMapTransformOptions): ShareTransform {
	if (!isRecord(keys)) {
		throw new Error('Key map transform keys must be an object of { longKey: shortKey }');
	}

	const forward = new Map<string, string>();
	const reverse = new Map<string, string>();

	for (const [longKey, shortKey] of Object.entries(keys)) {
		if (typeof shortKey !== 'string' || !shortKey) {
			throw new Error(`Key map transform value for "${longKey}" must be a non-empty string`);
		}
		if (longKey === shortKey) {
			throw new Error(`Key map transform entry "${longKey}" maps to itself`);
		}
		if (reverse.has(shortKey)) {
			throw new Error(`Duplicate key map transform short key "${shortKey}"`);
		}
		if (Object.prototype.hasOwnProperty.call(keys, shortKey)) {
			throw new Error(
				`Key map transform short key "${shortKey}" is also a long key; mappings must not chain`
			);
		}
		forward.set(longKey, shortKey);
		reverse.set(shortKey, longKey);
	}

	return {
		id,
		encode(value) {
			return renameKeys(value, forward, id);
		},
		decode(value) {
			return renameKeys(value, reverse, id);
		}
	};
}
