import ALGORITHMS from 'main/codecs';
import LOADERS from 'main/loaders';

const AVAILABLE_CODECS = Object.freeze(Object.keys(ALGORITHMS));

function twoDigitPercentage(val) {
	return Math.floor(val * 10000) / 10000;
}

function isObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCodecId(id, label = 'codec') {
	if (typeof id !== 'string' || !id.trim()) {
		throw new Error(`Expected ${label} to have a non-empty string id`);
	}

	const normalized = id.trim();
	if (normalized.includes('.')) {
		throw new Error(`Expected ${label} id to not contain "."`);
	}

	return normalized;
}

function normalizeTransforms(transforms = []) {
	if (!transforms) return [];
	if (!Array.isArray(transforms)) {
		throw new Error('Expected transforms to be an array');
	}

	return transforms.map((transform, index) => {
		if (!isObject(transform)) {
			throw new Error(`Transform at index ${index} must be an object`);
		}

		if (typeof transform.encode !== 'function' && typeof transform.decode !== 'function') {
			throw new Error(`Transform at index ${index} must provide encode or decode`);
		}

		return {
			id: typeof transform.id === 'string' && transform.id.trim()
				? transform.id.trim()
				: `transform_${index + 1}`,
			encode: transform.encode,
			decode: transform.decode
		};
	});
}

async function applyTransforms(value, transforms, direction) {
	const ordered = direction === 'encode' ? transforms : [...transforms].reverse();
	let next = value;

	for (const transform of ordered) {
		const handler = direction === 'encode' ? transform.encode : transform.decode;
		if (typeof handler !== 'function') continue;
		next = await handler(next);
	}

	return next;
}

async function serializeValue(value, config) {
	if (!config.pack) {
		return JSON.stringify(value);
	}

	const msgpack = await LOADERS.msgpack();
	return msgpack.encode(value);
}

async function deserializeValue(value, config) {
	if (!config.pack) {
		return JSON.parse(value);
	}

	const msgpack = await LOADERS.msgpack();
	return msgpack.decode(value);
}

async function encodeCompressedValue(value, config) {
	if (!config.encode) {
		return value;
	}

	const safe64 = await LOADERS.safe64();
	return safe64.encode(value);
}

async function decodeCompressedValue(value, config) {
	if (!config.encode) {
		return value;
	}

	const safe64 = await LOADERS.safe64();
	return safe64.decode(value);
}

function getAlgorithmConfig(algorithm) {
	const codecId = normalizeCodecId(algorithm, 'algorithm');
	if (!Object.prototype.hasOwnProperty.call(ALGORITHMS, codecId)) {
		throw new Error(`No such algorithm ${codecId}`);
	}

	return {
		id: codecId,
		config: ALGORITHMS[codecId]
	};
}

function buildToken(version, codecId, payload) {
	return `${version}.${codecId}.${payload}`;
}

function parseToken(token) {
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

function normalizeMaxLength(maxLength) {
	if (typeof maxLength === 'undefined' || maxLength === null) {
		return Infinity;
	}

	if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || maxLength <= 0) {
		throw new Error('Expected maxLength to be a positive finite number');
	}

	return Math.floor(maxLength);
}

function createStats({ rawText, transformedText, tokenLength, codecId, token, candidates }) {
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
		compression: twoDigitPercentage(rawencoded / tokenLength),
		candidates
	};
}

function normalizeCodecSpec(codec, index) {
	if (typeof codec === 'string') {
		const client = createNamedCodec(codec);
		return { id: client.id, client };
	}

	if (!isObject(codec)) {
		throw new Error(`Codec at index ${index} must be a string or codec object`);
	}

	const codecId = normalizeCodecId(codec.id, `codec at index ${index}`);
	if (typeof codec.compress !== 'function' || typeof codec.decompress !== 'function') {
		throw new Error(`Codec "${codecId}" must provide compress and decompress`);
	}

	return {
		id: codecId,
		client: codec
	};
}

export function createNamedCodec(algorithm, options = {}) {
	const transforms = normalizeTransforms(options.transforms);
	const { id, config } = getAlgorithmConfig(algorithm);

	async function prepareInput(json) {
		const transformed = await applyTransforms(json, transforms, 'encode');
		return {
			transformed,
			transformedText: JSON.stringify(transformed)
		};
	}

	async function compress(json) {
		const { transformed } = await prepareInput(json);
		const packed = await serializeValue(transformed, config);
		const compressed = await config.compress(packed);
		return encodeCompressedValue(compressed, config);
	}

	async function decompress(string) {
		const decoded = await decodeCompressedValue(string, config);
		const decompressed = await config.decompress(decoded);
		const unpacked = await deserializeValue(decompressed, config);
		return applyTransforms(unpacked, transforms, 'decode');
	}

	async function stats(json) {
		const rawText = JSON.stringify(json);
		const { transformedText } = await prepareInput(json);
		const token = await compress(json);
		return {
			...createStats({
				rawText,
				transformedText,
				tokenLength: token.length,
				codecId: id,
				token
			}),
			algorithm: id,
			transforms: transforms.map((transform) => transform.id)
		};
	}

	return {
		id,
		compress,
		decompress,
		stats,
		transforms: transforms.map((transform) => transform.id)
	};
}

export function createEngine(options = {}) {
	const transforms = normalizeTransforms(options.transforms);
	const codecSpecs = Array.isArray(options.codecs) && options.codecs.length > 0
		? options.codecs
		: AVAILABLE_CODECS;
	const codecEntries = codecSpecs.map((codec, index) => normalizeCodecSpec(codec, index));
	const codecMap = new Map();
	const maxLength = normalizeMaxLength(options.maxLength);
	const version = typeof options.version === 'undefined' ? '1' : normalizeCodecId(String(options.version), 'version');
	const alwaysPrefix = typeof options.alwaysPrefix === 'boolean'
		? options.alwaysPrefix
		: codecEntries.length !== 1;
	const defaultCodec = typeof options.defaultCodec === 'undefined'
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

	async function prepareInput(json) {
		const transformed = await applyTransforms(json, transforms, 'encode');
		return {
			rawText: JSON.stringify(json),
			transformed,
			transformedText: JSON.stringify(transformed)
		};
	}

	async function compressDetailed(json) {
		const { rawText, transformed, transformedText } = await prepareInput(json);
		const rawencoded = encodeURIComponent(rawText).length;
		const transformedencoded = encodeURIComponent(transformedText).length;
		const candidates = [];

		for (const entry of codecEntries) {
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
			candidates
		};
	}

	async function compress(json) {
		const result = await compressDetailed(json);
		return result.token;
	}

	async function decompress(token) {
		const parsed = parseToken(token);

		if (parsed && parsed.version === version && codecMap.has(parsed.codecId)) {
			const decoded = await codecMap.get(parsed.codecId).client.decompress(parsed.payload);
			return applyTransforms(decoded, transforms, 'decode');
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

		const decoded = await codecMap.get(defaultCodec).client.decompress(token);
		return applyTransforms(decoded, transforms, 'decode');
	}

	async function stats(json) {
		return compressDetailed(json);
	}

	return {
		version,
		codecs: codecEntries.map((entry) => entry.id),
		transforms: transforms.map((transform) => transform.id),
		compress,
		compressBest: compressDetailed,
		compressDetailed,
		decompress,
		stats
	};
}

export { AVAILABLE_CODECS };
