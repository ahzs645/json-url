import { Buffer } from 'buffer';

import br from './codecs/br.js';
import df from './codecs/df.js';
import gz from './codecs/gz.js';
import lz from './codecs/lz.js';
import raw from './codecs/raw.js';
import { prepareEncodedInput } from './decode-utils.js';
import CORE_LOADERS from './core-loaders.js';

import type {
	CodecAlgorithmConfig,
	CodecCandidateStats,
	CreateEngineOptions,
	EngineClient,
	EngineCompressResult,
	JsonUrlValue,
	ShareCodecDefinition,
	ShareTransform,
	SkippedCodecStat
} from './types.js';

interface NormalizedTransform {
	id: string;
	encode?: ShareTransform['encode'];
	decode?: ShareTransform['decode'];
}

interface ParsedToken {
	version: string;
	codecId: string;
	payload: string;
}

interface CodecEntry {
	id: string;
	client: ShareCodecDefinition;
}

const WEB_SHARE_ALGORITHMS: Record<string, CodecAlgorithmConfig> = {
	raw,
	gz,
	df,
	br,
	lz
};

const DEFAULT_WEB_SHARE_CODECS = Object.freeze(['raw', 'gz', 'df', 'br', 'lz']);
const DEFAULT_WEB_SHARE_VERSION = '1';
const DEFAULT_WEB_SHARE_MAX_LENGTH = 12000;

function twoDigitPercentage(value: number): number {
	return Math.floor(value * 10000) / 10000;
}

function isObject(value: JsonUrlValue): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCodecId(id: string, label = 'codec'): string {
	if (typeof id !== 'string' || !id.trim()) {
		throw new Error(`Expected ${label} to have a non-empty string id`);
	}

	const normalized = id.trim();
	if (normalized.includes('.')) {
		throw new Error(`Expected ${label} id to not contain "."`);
	}

	return normalized;
}

function normalizeTransforms(transforms: ShareTransform[] = []): NormalizedTransform[] {
	if (!transforms) return [];
	if (!Array.isArray(transforms)) {
		throw new Error('Expected transforms to be an array');
	}

	return transforms.map((transform, index) => {
		if (!isObject(transform)) {
			throw new Error(`Transform at index ${index} must be an object`);
		}

		const candidate = transform as ShareTransform;
		if (typeof candidate.encode !== 'function' && typeof candidate.decode !== 'function') {
			throw new Error(`Transform at index ${index} must provide encode or decode`);
		}

		return {
			id:
				typeof candidate.id === 'string' && candidate.id.trim()
					? candidate.id.trim()
					: `transform_${index + 1}`,
			encode: candidate.encode,
			decode: candidate.decode
		};
	});
}

async function applyTransforms(
	value: JsonUrlValue,
	transforms: NormalizedTransform[],
	direction: 'encode' | 'decode'
): Promise<JsonUrlValue> {
	const ordered = direction === 'encode' ? transforms : [...transforms].reverse();
	let next = value;

	for (const transform of ordered) {
		const handler = direction === 'encode' ? transform.encode : transform.decode;
		if (typeof handler !== 'function') continue;
		next = await handler(next);
	}

	return next;
}

async function serializeValue(
	value: JsonUrlValue,
	config: CodecAlgorithmConfig
): Promise<string | Uint8Array> {
	if (!config.pack) {
		return JSON.stringify(value);
	}

	const msgpack = await CORE_LOADERS.msgpack();
	return msgpack.encode(value);
}

async function deserializeValue(
	value: string | Uint8Array,
	config: CodecAlgorithmConfig
): Promise<JsonUrlValue> {
	if (!config.pack) {
		return JSON.parse(String(value));
	}

	const msgpack = await CORE_LOADERS.msgpack();
	return msgpack.decode(Buffer.from(value));
}

async function encodeCompressedValue(
	value: string | Uint8Array,
	config: CodecAlgorithmConfig
): Promise<string> {
	if (!config.encode) {
		return typeof value === 'string' ? value : Buffer.from(value).toString('utf8');
	}

	const safe64 = await CORE_LOADERS.safe64();
	return safe64.encode(typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value));
}

async function decodeCompressedValue(
	value: string,
	config: CodecAlgorithmConfig
): Promise<string | Uint8Array> {
	if (!config.encode) {
		return value;
	}

	const safe64 = await CORE_LOADERS.safe64();
	return safe64.decode(value);
}

function buildToken(version: string, codecId: string, payload: string): string {
	return `${version}.${codecId}.${payload}`;
}

function parseToken(token: string): ParsedToken | null {
	if (typeof token !== 'string' || !token.trim()) {
		throw new Error('Expected token to be a non-empty string');
	}

	const trimmed = token.trim();
	const firstDot = trimmed.indexOf('.');
	const secondDot = trimmed.indexOf('.', firstDot + 1);

	if (firstDot <= 0 || secondDot <= firstDot + 1) {
		return null;
	}

	return {
		version: trimmed.slice(0, firstDot),
		codecId: trimmed.slice(firstDot + 1, secondDot),
		payload: trimmed.slice(secondDot + 1)
	};
}

function normalizeMaxLength(maxLength?: number | null): number {
	if (typeof maxLength === 'undefined' || maxLength === null) {
		return Number.POSITIVE_INFINITY;
	}

	if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || maxLength <= 0) {
		throw new Error('Expected maxLength to be a positive finite number');
	}

	return Math.floor(maxLength);
}

function createCodecClient(id: string, config: CodecAlgorithmConfig): ShareCodecDefinition {
	return {
		id,
		async compress(value) {
			const packed = await serializeValue(value, config);
			const compressed = await config.compress(packed);
			return encodeCompressedValue(compressed, config);
		},
		async decompress(token) {
			const decoded = await decodeCompressedValue(token, config);
			const decompressed = await config.decompress(decoded);
			return deserializeValue(decompressed, config);
		}
	};
}

function normalizeCodecSpec(codec: string | ShareCodecDefinition, index: number): CodecEntry {
	if (typeof codec === 'string') {
		const codecId = normalizeCodecId(codec, `codec at index ${index}`);
		const config = WEB_SHARE_ALGORITHMS[codecId];
		if (!config) {
			throw new Error(`Unknown web share codec "${codecId}"`);
		}
		return { id: codecId, client: createCodecClient(codecId, config) };
	}

	if (!isObject(codec)) {
		throw new Error(`Codec at index ${index} must be a string or codec object`);
	}

	const codecId = normalizeCodecId(String(codec.id), `codec at index ${index}`);
	if (typeof codec.compress !== 'function' || typeof codec.decompress !== 'function') {
		throw new Error(`Codec "${codecId}" must provide compress and decompress`);
	}

	return {
		id: codecId,
		client: codec
	};
}

function isUnsupportedCodecError(error: unknown): error is Error & { code: string } {
	return Boolean(error) && typeof error === 'object' && (error as { code?: string }).code === 'ERR_UNSUPPORTED_CODEC';
}

function createStatsBase({
	rawText,
	transformedText,
	tokenLength,
	codecId,
	token
}: {
	rawText: string;
	transformedText: string;
	tokenLength: number;
	codecId: string;
	token: string;
}) {
	const rawencoded = encodeURIComponent(rawText).length;
	const transformedencoded = encodeURIComponent(transformedText).length;

	return {
		codec: codecId,
		token,
		raw: rawText.length,
		rawencoded,
		transformed: transformedText.length,
		transformedencoded,
		compressedencoded: tokenLength,
		compression: twoDigitPercentage(rawencoded / tokenLength)
	};
}

function createWebShareEngine<TValue = JsonUrlValue>(
	options: CreateEngineOptions = {}
): EngineClient<TValue> {
	const transforms = normalizeTransforms(options.transforms);
	const transformIds = transforms.map((transform) => transform.id);
	const codecSpecs =
		Array.isArray(options.codecs) && options.codecs.length > 0
			? options.codecs
			: Array.from(DEFAULT_WEB_SHARE_CODECS);
	const codecEntries = codecSpecs.map((codec, index) => normalizeCodecSpec(codec, index));
	const codecMap = new Map<string, CodecEntry>();
	const maxLength = normalizeMaxLength(
		typeof options.maxLength === 'undefined' ? DEFAULT_WEB_SHARE_MAX_LENGTH : options.maxLength
	);
	const version =
		typeof options.version === 'undefined'
			? DEFAULT_WEB_SHARE_VERSION
			: normalizeCodecId(String(options.version), 'version');
	const skipUnsupportedCodecs =
		typeof options.skipUnsupportedCodecs === 'undefined'
			? true
			: options.skipUnsupportedCodecs === true;
	const alwaysPrefix =
		typeof options.alwaysPrefix === 'undefined' ? true : options.alwaysPrefix;
	const defaultCodec =
		typeof options.defaultCodec === 'undefined'
			? codecEntries[0]?.id
			: normalizeCodecId(options.defaultCodec, 'default codec');

	codecEntries.forEach((entry) => {
		if (codecMap.has(entry.id)) {
			throw new Error(`Duplicate codec id "${entry.id}"`);
		}
		codecMap.set(entry.id, entry);
	});

	if (!defaultCodec || !codecMap.has(defaultCodec)) {
		throw new Error(`Unknown default codec "${defaultCodec}"`);
	}

	async function prepareInput(json: TValue) {
		const transformed = await applyTransforms(json, transforms, 'encode');
		return {
			rawText: JSON.stringify(json),
			transformed,
			transformedText: JSON.stringify(transformed)
		};
	}

	async function compressDetailed(json: TValue): Promise<EngineCompressResult> {
		const { rawText, transformed, transformedText } = await prepareInput(json);
		const rawencoded = encodeURIComponent(rawText).length;
		const transformedencoded = encodeURIComponent(transformedText).length;
		const candidates: CodecCandidateStats[] = [];
		const skipped: SkippedCodecStat[] = [];

		for (const entry of codecEntries) {
			try {
				const payload = await entry.client.compress(transformed);
				if (typeof payload !== 'string') {
					throw new Error(`Codec "${entry.id}" returned a non-string token`);
				}

				const token = alwaysPrefix ? buildToken(version, entry.id, payload) : payload;
				candidates.push({
					codec: entry.id,
					token,
					tokenLength: token.length,
					payloadLength: payload.length,
					raw: rawText.length,
					rawencoded,
					transformed: transformedText.length,
					transformedencoded,
					compression: twoDigitPercentage(rawencoded / token.length)
				});
			} catch (error) {
				if (!skipUnsupportedCodecs || !isUnsupportedCodecError(error)) {
					throw error;
				}

				skipped.push({
					codec: entry.id,
					reason: (error as Error).message
				});
			}
		}

		if (candidates.length === 0) {
			throw new Error('No codec candidates were produced');
		}

		candidates.sort((a, b) => a.tokenLength - b.tokenLength);
		const best = candidates[0];

		if (best.tokenLength > maxLength) {
			throw new Error(`Encoded token exceeds maxLength (${best.tokenLength} > ${maxLength})`);
		}

		return {
			...createStatsBase({
				rawText,
				transformedText,
				tokenLength: best.tokenLength,
				codecId: best.codec,
				token: best.token
			}),
			candidates,
			skipped
		};
	}

	async function compress(json: TValue): Promise<string> {
		const result = await compressDetailed(json);
		return result.token;
	}

	async function decompress(token: string, options = {}): Promise<TValue> {
		const normalized = prepareEncodedInput(token, options);
		const parsed = parseToken(normalized);

		if (parsed && parsed.version === version && codecMap.has(parsed.codecId)) {
			const decoded = await codecMap.get(parsed.codecId)!.client.decompress(parsed.payload);
			return (await applyTransforms(decoded, transforms, 'decode')) as TValue;
		}

		if (parsed && (alwaysPrefix || codecEntries.length > 1)) {
			if (parsed.version !== version) {
				throw new Error(`Unsupported token version ${parsed.version}`);
			}
			throw new Error(`Unsupported codec ${parsed.codecId}`);
		}

		if (alwaysPrefix || codecEntries.length > 1) {
			throw new Error('Encoded token is missing a version/codec prefix');
		}

		const decoded = await codecMap.get(defaultCodec)!.client.decompress(normalized);
		return (await applyTransforms(decoded, transforms, 'decode')) as TValue;
	}

	async function tryDecompress(token: string, fallback: TValue, options = {}): Promise<TValue> {
		try {
			return await decompress(token, options);
		} catch {
			return fallback;
		}
	}

	return {
		version,
		codecs: codecEntries.map((entry) => entry.id),
		transforms: transformIds,
		skipUnsupportedCodecs,
		compress,
		compressBest: compressDetailed,
		compressDetailed,
		decompress,
		tryDecompress,
		tryDecodeToken: tryDecompress,
		stats: compressDetailed
	};
}

export default createWebShareEngine;
