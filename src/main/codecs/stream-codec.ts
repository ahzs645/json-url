import CORE_LOADERS from '../core-loaders.js';

type StreamCodecFormat = 'gzip' | 'deflate-raw' | 'brotli';

interface UnsupportedCodecError extends Error {
	code: 'ERR_UNSUPPORTED_CODEC';
	codec: string;
	cause?: unknown;
}

function toArrayBuffer(input: Uint8Array): ArrayBuffer {
	return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
}

function createUnsupportedCodecError(
	codecId: string,
	message: string,
	cause?: unknown
): UnsupportedCodecError {
	const error = new Error(message) as UnsupportedCodecError;
	error.code = 'ERR_UNSUPPORTED_CODEC';
	error.codec = codecId;
	if (typeof cause !== 'undefined') {
		error.cause = cause;
	}
	return error;
}

async function compressWithStreams(
	input: Uint8Array,
	format: StreamCodecFormat
): Promise<Uint8Array | null> {
	if (
		typeof CompressionStream === 'undefined' ||
		typeof Blob === 'undefined' ||
		typeof Response === 'undefined'
	) {
		return null;
	}

	try {
		const stream = new Blob([toArrayBuffer(input)])
			.stream()
			.pipeThrough(new CompressionStream(format as CompressionFormat));
		const buffer = await new Response(stream).arrayBuffer();
		return new Uint8Array(buffer);
	} catch {
		return null;
	}
}

async function decompressWithStreams(
	input: Uint8Array,
	format: StreamCodecFormat
): Promise<Uint8Array | null> {
	if (
		typeof DecompressionStream === 'undefined' ||
		typeof Blob === 'undefined' ||
		typeof Response === 'undefined'
	) {
		return null;
	}

	try {
		const stream = new Blob([toArrayBuffer(input)])
			.stream()
			.pipeThrough(new DecompressionStream(format as CompressionFormat));
		const buffer = await new Response(stream).arrayBuffer();
		return new Uint8Array(buffer);
	} catch {
		return null;
	}
}

function compressWithNodeZlib(
	input: Uint8Array,
	format: StreamCodecFormat,
	zlib: typeof import('node:zlib')
): Buffer | null {
	switch (format) {
	case 'gzip':
		return zlib.gzipSync(input);
	case 'deflate-raw':
		return zlib.deflateRawSync(input);
	case 'brotli':
		if (typeof zlib.brotliCompressSync !== 'function') return null;
		return zlib.brotliCompressSync(input);
	default:
		return null;
	}
}

function decompressWithNodeZlib(
	input: Uint8Array,
	format: StreamCodecFormat,
	zlib: typeof import('node:zlib')
): Buffer | null {
	switch (format) {
	case 'gzip':
		return zlib.gunzipSync(input);
	case 'deflate-raw':
		return zlib.inflateRawSync(input);
	case 'brotli':
		if (typeof zlib.brotliDecompressSync !== 'function') return null;
		return zlib.brotliDecompressSync(input);
	default:
		return null;
	}
}

export async function compressTextWithStreamCodec(
	value: string,
	format: StreamCodecFormat,
	codecId: string
): Promise<Uint8Array> {
	const input = new TextEncoder().encode(value);
	const zlib = await CORE_LOADERS.zlib();
	if (zlib) {
		const fallbackResult = compressWithNodeZlib(input, format, zlib);
		if (fallbackResult) return fallbackResult;
	}

	const streamResult = await compressWithStreams(input, format);
	if (streamResult) return streamResult;

	throw createUnsupportedCodecError(
		codecId,
		`Codec "${codecId}" is not supported in this environment.`
	);
}

export async function decompressTextWithStreamCodec(
	buffer: Uint8Array,
	format: StreamCodecFormat,
	codecId: string
): Promise<string> {
	const input = buffer;
	const zlib = await CORE_LOADERS.zlib();
	if (zlib) {
		const fallbackResult = decompressWithNodeZlib(input, format, zlib);
		if (fallbackResult) return new TextDecoder().decode(fallbackResult);
	}

	const streamResult = await decompressWithStreams(input, format);
	if (streamResult) return new TextDecoder().decode(streamResult);

	throw createUnsupportedCodecError(
		codecId,
		`Codec "${codecId}" cannot be decoded in this environment.`
	);
}

export { createUnsupportedCodecError };
