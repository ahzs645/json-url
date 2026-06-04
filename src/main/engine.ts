import { createUnsupportedCodecError } from './codecs/stream-codec.js';
import { prepareEncodedInput } from './decode-utils.js';

import type {
	CodecAlgorithmConfig,
	CodecAlgorithmLoader,
	CodecAlgorithmRegistry,
	CodecCandidateStats,
	CreateEngineOptions,
	CreateNamedCodecOptions,
	EngineClient,
	EngineCompressResult,
	JsonUrlValue,
	NamedCodecClient,
	NamedCodecStats,
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

interface MsgPackCodec {
	encode(value: unknown): Uint8Array;
	decode(value: Uint8Array): unknown;
}

const DEFAULT_WEB_SHARE_CODECS = Object.freeze(['raw', 'gz', 'df', 'zl', 'br', 'lz']);
const DEFAULT_WEB_SHARE_VERSION = '1';
const DEFAULT_WEB_SHARE_MAX_LENGTH = 12000;

interface JsonUrlRuntimeOptions {
	algorithms: CodecAlgorithmRegistry;
	defaultWebShareCodecs?: readonly string[];
	defaultWebShareVersion?: string;
	defaultWebShareMaxLength?: number;
	loadMsgpack?: () => Promise<MsgPackCodec>;
}

interface BufferConstructorLike {
	from(input: string, encoding: string): Uint8Array;
	from(input: Uint8Array): { toString(encoding: string): string };
}

function truncateTo4Decimals(value: number): number {
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
	config: CodecAlgorithmConfig,
	loadMsgpack?: () => Promise<MsgPackCodec>
): Promise<string | Uint8Array> {
	if (!config.pack) {
		return JSON.stringify(value);
	}

	if (!loadMsgpack) {
		throw new Error('MessagePack is not available in this runtime');
	}

	const msgpack = await loadMsgpack();
	return msgpack.encode(value);
}

async function deserializeValue(
	value: string | Uint8Array,
	config: CodecAlgorithmConfig,
	loadMsgpack?: () => Promise<MsgPackCodec>
): Promise<JsonUrlValue> {
	if (!config.pack) {
		return JSON.parse(String(value));
	}

	if (!loadMsgpack) {
		throw new Error('MessagePack is not available in this runtime');
	}

	const msgpack = await loadMsgpack();
	return msgpack.decode(typeof value === 'string' ? new TextEncoder().encode(value) : value);
}

function getGlobalBuffer(): BufferConstructorLike | null {
	const candidate = (globalThis as { Buffer?: BufferConstructorLike }).Buffer;
	return candidate && typeof candidate.from === 'function' ? candidate : null;
}

function bytesToBinary(bytes: Uint8Array): string {
	let binary = '';
	const chunkSize = 0x8000;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
	}
	return binary;
}

function binaryToBytes(binary: string): Uint8Array {
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function toBase64Url(value: string | Uint8Array): string {
	const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
	const buffer = getGlobalBuffer();
	const base64 = buffer ? buffer.from(bytes).toString('base64') : btoa(bytesToBinary(bytes));

	return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
	if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
		throw new Error('Encoded payload is not valid base64url');
	}

	const base64 = `${value.replaceAll('-', '+').replaceAll('_', '/')}${'='.repeat(
		(4 - (value.length % 4)) % 4
	)}`;
	const buffer = getGlobalBuffer();
	if (buffer) {
		return new Uint8Array(buffer.from(base64, 'base64'));
	}

	return binaryToBytes(atob(base64));
}

async function encodeCompressedValue(
	value: string | Uint8Array,
	config: CodecAlgorithmConfig
): Promise<string> {
	if (!config.encode) {
		return typeof value === 'string' ? value : new TextDecoder().decode(value);
	}

	return toBase64Url(value);
}

async function decodeCompressedValue(
	value: string,
	config: CodecAlgorithmConfig
): Promise<string | Uint8Array> {
	if (!config.encode) {
		return value;
	}

	return fromBase64Url(value);
}

function getAlgorithmConfigLoader(
	algorithm: string,
	algorithms: CodecAlgorithmRegistry
): { id: string; loadConfig: CodecAlgorithmLoader } {
	const codecId = normalizeCodecId(algorithm, 'algorithm');
	if (!Object.prototype.hasOwnProperty.call(algorithms, codecId)) {
		throw new Error(`No such algorithm ${codecId}`);
	}

	return {
		id: codecId,
		loadConfig: algorithms[codecId]
	};
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

function normalizeMaxDecompressedSize(maxDecompressedSize?: number): number {
	if (typeof maxDecompressedSize === 'undefined') {
		return Number.POSITIVE_INFINITY;
	}

	if (typeof maxDecompressedSize !== 'number' || !Number.isFinite(maxDecompressedSize) || maxDecompressedSize <= 0) {
		throw new Error('Expected maxDecompressedSize to be a positive finite number');
	}

	return Math.floor(maxDecompressedSize);
}

function enforceDecompressedSizeLimit(value: JsonUrlValue, limit: number): void {
	if (limit === Number.POSITIVE_INFINITY) return;

	const size = JSON.stringify(value).length;
	if (size > limit) {
		throw new Error(`Decompressed payload exceeds maxDecompressedSize (${size} > ${limit})`);
	}
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
		compression: truncateTo4Decimals(rawencoded / tokenLength)
	};
}

function normalizeCodecSpec(
	codec: string | ShareCodecDefinition,
	index: number,
	createCodec: (algorithm: string) => ShareCodecDefinition
): CodecEntry {
	if (typeof codec === 'string') {
		const client = createCodec(codec);
		return { id: client.id, client };
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

export function createJsonUrlRuntime({
	algorithms,
	defaultWebShareCodecs = DEFAULT_WEB_SHARE_CODECS,
	defaultWebShareVersion = DEFAULT_WEB_SHARE_VERSION,
	defaultWebShareMaxLength = DEFAULT_WEB_SHARE_MAX_LENGTH,
	loadMsgpack
}: JsonUrlRuntimeOptions) {
	const AVAILABLE_CODECS = Object.freeze(Object.keys(algorithms));
	const RUNTIME_WEB_SHARE_CODECS = Object.freeze(Array.from(defaultWebShareCodecs));
	const RUNTIME_WEB_SHARE_VERSION = defaultWebShareVersion;
	const RUNTIME_WEB_SHARE_MAX_LENGTH = defaultWebShareMaxLength;

	function createNamedCodec<TValue = JsonUrlValue>(
	algorithm: string,
	options: CreateNamedCodecOptions = {}
): NamedCodecClient<TValue> {
	const transforms = normalizeTransforms(options.transforms);
	const transformIds = transforms.map((transform) => transform.id);
	const maxDecompressedSize = normalizeMaxDecompressedSize(options.maxDecompressedSize);
	const { id, loadConfig } = getAlgorithmConfigLoader(algorithm, algorithms);
	let configPromise: Promise<CodecAlgorithmConfig> | null = null;

	function getConfig(): Promise<CodecAlgorithmConfig> {
		configPromise ??= loadConfig();
		return configPromise;
	}

	async function prepareInput(json: JsonUrlValue) {
		const transformed = await applyTransforms(json, transforms, 'encode');
		return {
			transformed,
			transformedText: JSON.stringify(transformed)
		};
	}

	async function compress(json: TValue): Promise<string> {
		const { transformed } = await prepareInput(json);
		const config = await getConfig();
		const packed = await serializeValue(transformed, config, loadMsgpack);
		const compressed = await config.compress(packed);
		return encodeCompressedValue(compressed, config);
	}

	async function decompress(string: string, options = {}): Promise<TValue> {
		const config = await getConfig();
		const normalized = prepareEncodedInput(
			string,
			options,
			id === 'lz' ? { space: 'plus' } : undefined
		);
		const decoded = await decodeCompressedValue(normalized, config);
		const decompressed = await config.decompress(decoded);
		const unpacked = await deserializeValue(decompressed, config, loadMsgpack);
		enforceDecompressedSizeLimit(unpacked, maxDecompressedSize);
		const transformed = await applyTransforms(unpacked, transforms, 'decode');
		enforceDecompressedSizeLimit(transformed, maxDecompressedSize);
		return transformed as TValue;
	}

	async function tryDecompress(
		string: string,
		fallback: TValue,
		options = {}
	): Promise<TValue> {
		try {
			return await decompress(string, options);
		} catch {
			return fallback;
		}
	}

	async function stats(json: TValue): Promise<NamedCodecStats> {
		const rawText = JSON.stringify(json);
		const { transformedText } = await prepareInput(json);
		const token = await compress(json);
		return {
			...createStatsBase({
				rawText,
				transformedText,
				tokenLength: token.length,
				codecId: id,
				token
			}),
			algorithm: id,
			transforms: transformIds
		};
	}

	return {
		id,
		compress,
		decompress,
		tryDecompress,
		stats,
		transforms: transformIds
	};
}

	function createEngine<TValue = JsonUrlValue>(
	options: CreateEngineOptions = {}
): EngineClient<TValue> {
	const transforms = normalizeTransforms(options.transforms);
	const transformIds = transforms.map((transform) => transform.id);
	const codecSpecs =
		Array.isArray(options.codecs) && options.codecs.length > 0
			? options.codecs
			: AVAILABLE_CODECS;
	const codecEntries = codecSpecs.map((codec, index) =>
		normalizeCodecSpec(codec, index, createNamedCodec)
	);
	const codecMap = new Map<string, CodecEntry>();
	const maxLength = normalizeMaxLength(options.maxLength);
	const maxDecompressedSize = normalizeMaxDecompressedSize(options.maxDecompressedSize);
	const version =
		typeof options.version === 'undefined'
			? '1'
			: normalizeCodecId(String(options.version), 'version');
	const skipUnsupportedCodecs = options.skipUnsupportedCodecs === true;
	const plainTextThreshold =
		typeof options.plainTextThreshold === 'number' && Number.isFinite(options.plainTextThreshold) && options.plainTextThreshold > 0
			? Math.floor(options.plainTextThreshold)
			: 0;
	const alwaysPrefix =
		typeof options.alwaysPrefix === 'boolean'
			? options.alwaysPrefix
			: codecEntries.length !== 1;
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

		const results = await Promise.allSettled(
			codecEntries.map(async (entry) => {
				const payload = await entry.client.compress(transformed);
				if (typeof payload !== 'string') {
					throw new Error(`Codec "${entry.id}" returned a non-string token`);
				}
				return { entry, payload };
			})
		);

		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			if (result.status === 'fulfilled') {
				const { entry, payload } = result.value;
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
					compression: truncateTo4Decimals(rawencoded / token.length)
				});
			} else {
				const error = result.reason;
				if (!skipUnsupportedCodecs || !isUnsupportedCodecError(error)) {
					throw error;
				}

				skipped.push({
					codec: codecEntries[i].id,
					reason: (error as Error).message
				});
			}
		}

		if (candidates.length === 0) {
			if (skipped.length > 0) {
				throw createUnsupportedCodecError(
					'engine',
					`None of the configured codecs are supported in this environment: ${skipped
						.map((entry) => entry.codec)
						.join(', ')}`
				);
			}
			throw new Error('No codec candidates were produced');
		}

		candidates.sort((a, b) => a.tokenLength - b.tokenLength);
		const best = candidates[0];

		if (best.tokenLength > maxLength) {
			throw new Error(`Encoded token exceeds maxLength (${best.tokenLength} > ${maxLength})`);
		}

		return {
			codec: best.codec,
			token: best.token,
			raw: rawText.length,
			rawencoded,
			transformed: transformedText.length,
			transformedencoded,
			compressedencoded: best.tokenLength,
			compression: best.compression,
			candidates,
			skipped
		};
	}

	async function compress(json: TValue): Promise<string> {
		const result = await compressDetailed(json);
		return result.token;
	}

	async function compressConditional(json: TValue): Promise<string | null> {
		if (plainTextThreshold > 0) {
			const rawencoded = encodeURIComponent(JSON.stringify(json)).length;
			if (rawencoded <= plainTextThreshold) {
				return null;
			}
		}
		return compress(json);
	}

	async function decompress(token: string, options = {}): Promise<TValue> {
		const normalized = prepareEncodedInput(token, options, { space: 'preserve' });
		const parsed = parseToken(normalized);

		if (parsed && parsed.version === version && codecMap.has(parsed.codecId)) {
			const payload = prepareEncodedInput(
				parsed.payload,
				options,
				parsed.codecId === 'lz' ? { decode: false, space: 'plus' } : { decode: false }
			);
			const decoded = await codecMap.get(parsed.codecId)!.client.decompress(payload);
			enforceDecompressedSizeLimit(decoded, maxDecompressedSize);
			const transformed = await applyTransforms(decoded, transforms, 'decode');
			enforceDecompressedSizeLimit(transformed, maxDecompressedSize);
			return transformed as TValue;
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

		const payload = prepareEncodedInput(
			normalized,
			options,
			defaultCodec === 'lz' ? { decode: false, space: 'plus' } : { decode: false }
		);
		const decoded = await codecMap.get(defaultCodec)!.client.decompress(payload);
		enforceDecompressedSizeLimit(decoded, maxDecompressedSize);
		const transformed = await applyTransforms(decoded, transforms, 'decode');
		enforceDecompressedSizeLimit(transformed, maxDecompressedSize);
		return transformed as TValue;
	}

	async function tryDecompress(
		token: string,
		fallback: TValue,
		options = {}
	): Promise<TValue> {
		try {
			return await decompress(token, options);
		} catch {
			return fallback;
		}
	}

	async function stats(json: TValue): Promise<EngineCompressResult> {
		return compressDetailed(json);
	}

	return {
		version,
		codecs: codecEntries.map((entry) => entry.id),
		transforms: transformIds,
		skipUnsupportedCodecs,
		plainTextThreshold,
		compress,
		compressConditional,
		compressBest: compressDetailed,
		compressDetailed,
		decompress,
		tryDecompress,
		tryDecodeToken: tryDecompress,
		stats
	};
}

	function createWebShareEngine<TValue = JsonUrlValue>(
	options: CreateEngineOptions = {}
): EngineClient<TValue> {
	const nextOptions = {
		...options,
		version: typeof options.version === 'undefined' ? RUNTIME_WEB_SHARE_VERSION : options.version,
		alwaysPrefix: typeof options.alwaysPrefix === 'undefined' ? true : options.alwaysPrefix,
		maxLength:
			typeof options.maxLength === 'undefined'
				? RUNTIME_WEB_SHARE_MAX_LENGTH
				: options.maxLength,
		skipUnsupportedCodecs:
			typeof options.skipUnsupportedCodecs === 'undefined'
				? true
				: options.skipUnsupportedCodecs,
		codecs:
			Array.isArray(options.codecs) && options.codecs.length > 0
				? options.codecs
				: Array.from(RUNTIME_WEB_SHARE_CODECS)
	};

	return createEngine<TValue>(nextOptions);
}

	return {
		AVAILABLE_CODECS,
		DEFAULT_WEB_SHARE_CODECS: RUNTIME_WEB_SHARE_CODECS,
		DEFAULT_WEB_SHARE_MAX_LENGTH: RUNTIME_WEB_SHARE_MAX_LENGTH,
		DEFAULT_WEB_SHARE_VERSION: RUNTIME_WEB_SHARE_VERSION,
		createEngine,
		createNamedCodec,
		createWebShareEngine
	};
}
