import type {
	JsonUrlValue,
	ReferenceTransformOptions,
	ReferenceTransformKey,
	ShareTransform
} from './types.js';

function isRecord(value: JsonUrlValue): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stableStringify(value: JsonUrlValue): string {
	if (typeof value === 'undefined') return 'undefined';
	if (Array.isArray(value)) {
		return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
	}
	if (isRecord(value)) {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
			.join(',')}}`;
	}
	return JSON.stringify(value);
}

function cloneJsonValue<TValue>(value: TValue): TValue {
	if (typeof structuredClone === 'function') {
		return structuredClone(value);
	}
	return JSON.parse(JSON.stringify(value)) as TValue;
}

function normalizeReferenceKey(key: ReferenceTransformKey): ReferenceTransformKey {
	if (typeof key !== 'string' && typeof key !== 'number') {
		throw new Error('Reference transform keys must be strings or numbers');
	}
	return key;
}

export function createReferenceTransform<TValue = JsonUrlValue>({
	id = 'reference',
	entries,
	refKey = '$ref',
	valueKey = '$value',
	signature = (value: TValue) => stableStringify(value),
	clone = cloneJsonValue
}: ReferenceTransformOptions<TValue>): ShareTransform {
	if (!Array.isArray(entries)) {
		throw new Error('Reference transform entries must be an array');
	}
	if (!refKey || !valueKey || refKey === valueKey) {
		throw new Error('Reference transform refKey and valueKey must be distinct non-empty strings');
	}

	const keyBySignature = new Map<string, ReferenceTransformKey>();
	const valueByKey = new Map<ReferenceTransformKey, TValue>();

	for (const entry of entries) {
		const key = normalizeReferenceKey(entry.key);
		const valueSignature = signature(entry.value);
		if (keyBySignature.has(valueSignature)) {
			throw new Error(`Duplicate reference transform signature for key "${String(key)}"`);
		}
		if (valueByKey.has(key)) {
			throw new Error(`Duplicate reference transform key "${String(key)}"`);
		}
		keyBySignature.set(valueSignature, key);
		valueByKey.set(key, entry.value);
	}

	return {
		id,
		encode(value) {
			const key = keyBySignature.get(signature(value as TValue));
			if (typeof key === 'undefined') return value;
			return { [refKey]: key };
		},
		decode(value) {
			if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, refKey)) return value;
			if (Object.prototype.hasOwnProperty.call(value, valueKey)) return value[valueKey];

			const key = normalizeReferenceKey(value[refKey] as ReferenceTransformKey);
			if (!valueByKey.has(key)) {
				throw new Error(`Unknown reference transform key "${String(key)}"`);
			}
			return clone(valueByKey.get(key) as TValue);
		}
	};
}
