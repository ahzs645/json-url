import LOADERS from "../loaders.js";
function createUnsupportedCodecError(codecId, message, cause) {
  const error = new Error(message);
  error.code = 'ERR_UNSUPPORTED_CODEC';
  error.codec = codecId;
  if (cause) {
    error.cause = cause;
  }
  return error;
}
async function compressWithStreams(input, format) {
  if (typeof CompressionStream === 'undefined' || typeof Blob === 'undefined' || typeof Response === 'undefined') {
    return null;
  }
  try {
    const stream = new Blob([input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)]).stream().pipeThrough(new CompressionStream(format));
    const buffer = await new Response(stream).arrayBuffer();
    return Buffer.from(buffer);
  } catch {
    return null;
  }
}
async function decompressWithStreams(input, format) {
  if (typeof DecompressionStream === 'undefined' || typeof Blob === 'undefined' || typeof Response === 'undefined') {
    return null;
  }
  try {
    const stream = new Blob([input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)]).stream().pipeThrough(new DecompressionStream(format));
    const buffer = await new Response(stream).arrayBuffer();
    return Buffer.from(buffer);
  } catch {
    return null;
  }
}
function compressWithNodeZlib(input, format, zlib) {
  switch (format) {
    case 'gzip':
      return Buffer.from(zlib.gzipSync(input));
    case 'deflate-raw':
      return Buffer.from(zlib.deflateRawSync(input));
    case 'brotli':
      if (typeof zlib.brotliCompressSync !== 'function') return null;
      return Buffer.from(zlib.brotliCompressSync(input));
    default:
      return null;
  }
}
function decompressWithNodeZlib(input, format, zlib) {
  switch (format) {
    case 'gzip':
      return Buffer.from(zlib.gunzipSync(input));
    case 'deflate-raw':
      return Buffer.from(zlib.inflateRawSync(input));
    case 'brotli':
      if (typeof zlib.brotliDecompressSync !== 'function') return null;
      return Buffer.from(zlib.brotliDecompressSync(input));
    default:
      return null;
  }
}
export async function compressTextWithStreamCodec(string, format, codecId) {
  const input = Buffer.from(string, 'utf8');
  const streamResult = await compressWithStreams(input, format);
  if (streamResult) return streamResult;
  const zlib = await LOADERS.zlib();
  if (zlib) {
    const fallbackResult = compressWithNodeZlib(input, format, zlib);
    if (fallbackResult) return fallbackResult;
  }
  throw createUnsupportedCodecError(codecId, `Codec "${codecId}" is not supported in this environment.`);
}
export async function decompressTextWithStreamCodec(buffer, format, codecId) {
  const input = Buffer.from(buffer);
  const streamResult = await decompressWithStreams(input, format);
  if (streamResult) return streamResult.toString('utf8');
  const zlib = await LOADERS.zlib();
  if (zlib) {
    const fallbackResult = decompressWithNodeZlib(input, format, zlib);
    if (fallbackResult) return fallbackResult.toString('utf8');
  }
  throw createUnsupportedCodecError(codecId, `Codec "${codecId}" cannot be decoded in this environment.`);
}
export { createUnsupportedCodecError };