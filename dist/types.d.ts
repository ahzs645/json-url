export type JsonUrlValue = unknown;
export type TransformHandler = (value: JsonUrlValue) => JsonUrlValue | Promise<JsonUrlValue>;
export interface DecodeOptions {
    deURI?: boolean;
}
export interface ShareTransform {
    id?: string;
    encode?: TransformHandler;
    decode?: TransformHandler;
}
export interface CodecCandidateStats {
    codec: string;
    token: string;
    tokenLength: number;
    payloadLength: number;
    raw: number;
    rawencoded: number;
    transformed: number;
    transformedencoded: number;
    compression: number;
}
export interface SkippedCodecStat {
    codec: string;
    reason: string;
}
export interface CodecStatsBase {
    codec: string;
    token: string;
    raw: number;
    rawencoded: number;
    transformed: number;
    transformedencoded: number;
    compressedencoded: number;
    compression: number;
}
export interface NamedCodecStats extends CodecStatsBase {
    algorithm: string;
    transforms: string[];
}
export interface EngineCompressResult extends CodecStatsBase {
    candidates: CodecCandidateStats[];
    skipped: SkippedCodecStat[];
}
export interface ShareCodecDefinition {
    id: string;
    compress(value: JsonUrlValue): Promise<string>;
    decompress(token: string): Promise<JsonUrlValue>;
}
export interface CreateNamedCodecOptions {
    transforms?: ShareTransform[];
}
export interface CreateEngineOptions extends CreateNamedCodecOptions {
    codecs?: Array<string | ShareCodecDefinition>;
    version?: string | number;
    maxLength?: number;
    alwaysPrefix?: boolean;
    skipUnsupportedCodecs?: boolean;
    defaultCodec?: string;
    plainTextThreshold?: number;
}
export interface NamedCodecClient<TValue = JsonUrlValue> {
    id: string;
    transforms: string[];
    compress(value: TValue): Promise<string>;
    decompress(token: string, options?: DecodeOptions): Promise<TValue>;
    tryDecompress(token: string, fallback: TValue, options?: DecodeOptions): Promise<TValue>;
    stats(value: TValue): Promise<NamedCodecStats>;
}
export interface EngineClient<TValue = JsonUrlValue> {
    version: string;
    codecs: string[];
    transforms: string[];
    skipUnsupportedCodecs: boolean;
    plainTextThreshold: number;
    compress(value: TValue): Promise<string>;
    compressConditional(value: TValue): Promise<string | null>;
    compressBest(value: TValue): Promise<EngineCompressResult>;
    compressDetailed(value: TValue): Promise<EngineCompressResult>;
    decompress(token: string, options?: DecodeOptions): Promise<TValue>;
    tryDecompress(token: string, fallback: TValue, options?: DecodeOptions): Promise<TValue>;
    tryDecodeToken(token: string, fallback: TValue, options?: DecodeOptions): Promise<TValue>;
    stats(value: TValue): Promise<EngineCompressResult>;
}
export interface JsonUrlFactory {
    <TValue = JsonUrlValue>(algorithm: string, options?: CreateNamedCodecOptions): NamedCodecClient<TValue>;
    availableCodecs: readonly string[];
    cleanEncodedInput(input: string): string;
    defaultWebShareCodecs: readonly string[];
    defaultWebShareMaxLength: number;
    defaultWebShareVersion: string;
    createEngine<TValue = JsonUrlValue>(options?: CreateEngineOptions): EngineClient<TValue>;
    createNamedCodec<TValue = JsonUrlValue>(algorithm: string, options?: CreateNamedCodecOptions): NamedCodecClient<TValue>;
    createWebShareEngine<TValue = JsonUrlValue>(options?: CreateEngineOptions): EngineClient<TValue>;
}
export interface CodecAlgorithmConfig {
    pack: boolean;
    encode: boolean;
    compress(input: string | Uint8Array): Promise<string | Uint8Array>;
    decompress(input: string | Uint8Array): Promise<string | Uint8Array>;
}
//# sourceMappingURL=types.d.ts.map