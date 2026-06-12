export type JsonUrlValue = unknown;

export type TransformHandler = (
	value: JsonUrlValue
) => JsonUrlValue | Promise<JsonUrlValue>;

export interface DecodeOptions {
	deURI?: boolean;
}

export interface ShareTransform {
	id?: string;
	encode?: TransformHandler;
	decode?: TransformHandler;
}

export type ReferenceTransformKey = string | number;

export interface ReferenceTransformEntry<TValue = JsonUrlValue> {
	key: ReferenceTransformKey;
	value: TValue;
}

export interface ReferenceTransformOptions<TValue = JsonUrlValue> {
	id?: string;
	entries: Array<ReferenceTransformEntry<TValue>>;
	refKey?: string;
	valueKey?: string;
	signature?: (value: TValue) => string;
	clone?: (value: TValue) => TValue;
}

export interface KeyMapTransformOptions {
	id?: string;
	keys: Record<string, string>;
}

export interface NumberPrecisionTransformOptions {
	id?: string;
	decimals: number;
}

export type UrlShareLocation = 'query' | 'hash';

export interface UrlShareOptions {
	param?: string;
	location?: UrlShareLocation;
	maxUrlLength?: number;
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
	maxDecompressedSize?: number;
}

export interface CreateEngineOptions extends CreateNamedCodecOptions {
	codecs?: Array<string | ShareCodecDefinition>;
	version?: string | number;
	maxLength?: number;
	maxDecompressedSize?: number;
	alwaysPrefix?: boolean;
	skipUnsupportedCodecs?: boolean;
	defaultCodec?: string;
	plainTextThreshold?: number;
	checksum?: boolean;
}

export interface NamedCodecClient<TValue = JsonUrlValue> {
	id: string;
	transforms: string[];
	compress(value: TValue): Promise<string>;
	compressToUrl(value: TValue, baseUrl: string, options?: UrlShareOptions): Promise<string>;
	decompress(token: string, options?: DecodeOptions): Promise<TValue>;
	decompressFromUrl(url: string, options?: UrlShareOptions): Promise<TValue>;
	tryDecompress(token: string, fallback: TValue, options?: DecodeOptions): Promise<TValue>;
	tryDecompressFromUrl(url: string, fallback: TValue, options?: UrlShareOptions): Promise<TValue>;
	stats(value: TValue): Promise<NamedCodecStats>;
}

export interface EngineClient<TValue = JsonUrlValue> {
	version: string;
	codecs: string[];
	transforms: string[];
	skipUnsupportedCodecs: boolean;
	plainTextThreshold: number;
	checksum: boolean;
	compress(value: TValue): Promise<string>;
	compressConditional(value: TValue): Promise<string | null>;
	compressBest(value: TValue): Promise<EngineCompressResult>;
	compressDetailed(value: TValue): Promise<EngineCompressResult>;
	compressToUrl(value: TValue, baseUrl: string, options?: UrlShareOptions): Promise<string>;
	decompress(token: string, options?: DecodeOptions): Promise<TValue>;
	decompressFromUrl(url: string, options?: UrlShareOptions): Promise<TValue>;
	tryDecompress(token: string, fallback: TValue, options?: DecodeOptions): Promise<TValue>;
	tryDecodeToken(token: string, fallback: TValue, options?: DecodeOptions): Promise<TValue>;
	tryDecompressFromUrl(url: string, fallback: TValue, options?: UrlShareOptions): Promise<TValue>;
	stats(value: TValue): Promise<EngineCompressResult>;
}

export interface JsonUrlFactory {
	<TValue = JsonUrlValue>(algorithm: string, options?: CreateNamedCodecOptions): NamedCodecClient<TValue>;
	availableCodecs: readonly string[];
	cleanEncodedInput(input: string): string;
	defaultWebShareCodecs: readonly string[];
	defaultWebShareMaxLength: number;
	defaultWebShareVersion: string;
	createReferenceTransform<TValue = JsonUrlValue>(options: ReferenceTransformOptions<TValue>): ShareTransform;
	createKeyMapTransform(options: KeyMapTransformOptions): ShareTransform;
	createNumberPrecisionTransform(options: NumberPrecisionTransformOptions): ShareTransform;
	buildShareUrl(baseUrl: string, token: string, options?: UrlShareOptions): string;
	extractTokenFromUrl(url: string, options?: UrlShareOptions): string | null;
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
