type StreamCodecFormat = 'gzip' | 'deflate-raw' | 'brotli';
interface UnsupportedCodecError extends Error {
    code: 'ERR_UNSUPPORTED_CODEC';
    codec: string;
    cause?: unknown;
}
declare function createUnsupportedCodecError(codecId: string, message: string, cause?: unknown): UnsupportedCodecError;
export declare function compressTextWithStreamCodec(value: string, format: StreamCodecFormat, codecId: string): Promise<Uint8Array>;
export declare function decompressTextWithStreamCodec(buffer: Uint8Array, format: StreamCodecFormat, codecId: string): Promise<string>;
export { createUnsupportedCodecError };
//# sourceMappingURL=stream-codec.d.ts.map