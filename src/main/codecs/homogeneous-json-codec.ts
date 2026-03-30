import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from './stream-codec.js';
import type { CodecAlgorithmConfig } from '../types.js';

const RAW_PREFIX = 'HP0:';
const PACKED_PREFIX = 'HP1:';

interface PackedEnvelope {
	schema: string[];
	data: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeSchema(target: Set<string>, source: Set<string>) {
	for (const path of source) {
		target.add(path);
	}
}

function encodePath(path: string[]): string {
	if (path.length === 0) return '';
	return path.map((segment) => segment.replaceAll('~', '~0').replaceAll('/', '~1')).join('/');
}

function decodePath(path: string): string[] {
	if (!path) return [];
	return path.split('/').map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function comparePathDepthDescending(left: string, right: string): number {
	return decodePath(right).length - decodePath(left).length;
}

function comparePathDepthAscending(left: string, right: string): number {
	return decodePath(left).length - decodePath(right).length;
}

function isHomogeneousObjectArray(value: unknown): value is Array<Record<string, unknown>> {
	if (!Array.isArray(value) || value.length === 0) {
		return false;
	}

	if (!value.every((item) => isPlainObject(item))) {
		return false;
	}

	const keys = Object.keys(value[0]);
	for (let index = 1; index < value.length; index += 1) {
		const candidateKeys = Object.keys(value[index]);
		if (candidateKeys.length !== keys.length) {
			return false;
		}

		for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
			if (candidateKeys[keyIndex] !== keys[keyIndex]) {
				return false;
			}
		}
	}

	return true;
}

function packHomogeneousArray(value: Array<Record<string, unknown>>): unknown[] {
	const keys = value.length > 0 ? Object.keys(value[0]) : [];
	const packed = new Array<unknown>(2 + keys.length + value.length * keys.length);
	let offset = 0;

	packed[offset] = keys.length;
	offset += 1;
	packed[offset] = value.length;
	offset += 1;

	for (const key of keys) {
		packed[offset] = key;
		offset += 1;
	}

	for (const item of value) {
		for (const key of keys) {
			packed[offset] = item[key];
			offset += 1;
		}
	}

	return packed;
}

function unpackHomogeneousArray(value: unknown): Array<Record<string, unknown>> {
	if (!Array.isArray(value) || value.length < 2) {
		throw new Error('Expected packed homogeneous array payload');
	}

	const keyCount = value[0];
	const rowCount = value[1];
	if (
		typeof keyCount !== 'number' ||
		typeof rowCount !== 'number' ||
		!Number.isInteger(keyCount) ||
		!Number.isInteger(rowCount) ||
		keyCount < 0 ||
		rowCount < 0
	) {
		throw new Error('Invalid packed homogeneous array header');
	}

	const expectedLength = 2 + keyCount + rowCount * keyCount;
	if (value.length !== expectedLength) {
		throw new Error('Packed homogeneous array length mismatch');
	}

	const keys = value.slice(2, 2 + keyCount);
	if (!keys.every((key) => typeof key === 'string')) {
		throw new Error('Packed homogeneous array keys must be strings');
	}

	const rows = new Array<Record<string, unknown>>(rowCount);
	let offset = 2 + keyCount;
	for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
		const row: Record<string, unknown> = {};
		for (const key of keys as string[]) {
			row[key] = value[offset];
			offset += 1;
		}
		rows[rowIndex] = row;
	}

	return rows;
}

function preparePackedValue(
	value: unknown,
	path: string[] = []
): { data: unknown; schema: Set<string> } {
	if (Array.isArray(value)) {
		const schema = new Set<string>();
		const preparedItems = value.map((item) => {
			const prepared = preparePackedValue(item, path);
			mergeSchema(schema, prepared.schema);
			return prepared.data;
		});

		if (isHomogeneousObjectArray(preparedItems)) {
			const packed = packHomogeneousArray(preparedItems);
			if (JSON.stringify(packed).length < JSON.stringify(preparedItems).length) {
				schema.add(encodePath(path));
				return {
					data: packed,
					schema
				};
			}
		}

		return {
			data: preparedItems,
			schema
		};
	}

	if (isPlainObject(value)) {
		const schema = new Set<string>();
		const preparedObject: Record<string, unknown> = {};
		for (const key of Object.keys(value)) {
			const prepared = preparePackedValue(value[key], [...path, key]);
			mergeSchema(schema, prepared.schema);
			preparedObject[key] = prepared.data;
		}

		return {
			data: preparedObject,
			schema
		};
	}

	return {
		data: value,
		schema: new Set<string>()
	};
}

function applyPathVisitor(
	value: unknown,
	segments: string[],
	index: number,
	visitor: (input: unknown) => unknown
): unknown {
	if (index === segments.length) {
		return visitor(value);
	}

	if (Array.isArray(value)) {
		for (let itemIndex = 0; itemIndex < value.length; itemIndex += 1) {
			value[itemIndex] = applyPathVisitor(value[itemIndex], segments, index, visitor);
		}
		return value;
	}

	if (!isPlainObject(value)) {
		return value;
	}

	const segment = segments[index];
	if (!Object.prototype.hasOwnProperty.call(value, segment)) {
		return value;
	}

	value[segment] = applyPathVisitor(value[segment], segments, index + 1, visitor);
	return value;
}

function unpackWithSchema(value: unknown, schema: string[]): unknown {
	const orderedSchema = [...schema].sort(comparePathDepthAscending);
	let unpacked = value;
	for (const path of orderedSchema) {
		const segments = decodePath(path);
		unpacked = applyPathVisitor(unpacked, segments, 0, unpackHomogeneousArray);
	}
	return unpacked;
}

function encodePackedPayload(value: unknown): string {
	const prepared = preparePackedValue(value);
	const schema = [...prepared.schema];

	if (schema.length === 0) {
		return `${RAW_PREFIX}${JSON.stringify(value)}`;
	}

	return `${PACKED_PREFIX}${JSON.stringify({
		schema: schema.sort(comparePathDepthDescending),
		data: prepared.data
	} satisfies PackedEnvelope)}`;
}

function decodePackedPayload(text: string): string {
	if (text.startsWith(RAW_PREFIX)) {
		return text.slice(RAW_PREFIX.length);
	}

	if (!text.startsWith(PACKED_PREFIX)) {
		throw new Error('Invalid homogeneous codec payload prefix');
	}

	const envelope = JSON.parse(text.slice(PACKED_PREFIX.length)) as PackedEnvelope;
	if (!envelope || !Array.isArray(envelope.schema)) {
		throw new Error('Invalid homogeneous codec payload envelope');
	}

	if (!envelope.schema.every((path) => typeof path === 'string')) {
		throw new Error('Invalid homogeneous codec schema');
	}

	const unpacked = unpackWithSchema(envelope.data, envelope.schema);

	return JSON.stringify(unpacked);
}

export function createHomogeneousJsonCodec(
	format: 'gzip' | 'brotli',
	codecId: string
): CodecAlgorithmConfig {
	return {
		pack: false,
		encode: true,
		async compress(value) {
			const text = typeof value === 'string' ? value : new TextDecoder().decode(value);
			const packed = encodePackedPayload(JSON.parse(text));
			return compressTextWithStreamCodec(packed, format, codecId);
		},
		async decompress(buffer) {
			const decompressed = await decompressTextWithStreamCodec(
				typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
				format,
				codecId
			);
			return decodePackedPayload(decompressed);
		}
	};
}
