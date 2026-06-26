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

export type DefaultValue = JsonUrlValue | ((node: Record<string, unknown>) => JsonUrlValue);

export interface DefaultsRule {
	/**
	 * Record nodes this rule applies to. Omit to apply to the top-level value
	 * only (when it is a record). When provided, the rule runs on every record
	 * node in the tree where `match(node)` returns true.
	 */
	match?: (node: Record<string, unknown>) => boolean;
	/**
	 * Map of key -> default value (or `(node) => default`). On encode a key whose
	 * value is deep-equal to its default is stripped; on decode an absent key is
	 * restored to a clone of its default. Use `{}` / `[]` defaults to prune/restore
	 * empty containers.
	 */
	defaults: Record<string, DefaultValue>;
}

export interface DefaultsTransformOptions {
	id?: string;
	rules: DefaultsRule[];
	/** Restore stripped defaults on decode. Default true; set false for encode-only (lossy) compaction. */
	restore?: boolean;
	/** Deep-equality used to decide whether a value matches its default. */
	equals?: (a: JsonUrlValue, b: JsonUrlValue) => boolean;
	/** Clone used when restoring a default so callers never share references. */
	clone?: <TValue>(value: TValue) => TValue;
}

export interface ResolverReferenceTransformOptions {
	id?: string;
	/** Encode: identify an embedded record node that should be compacted to a reference. */
	match: (node: Record<string, unknown>) => boolean;
	/** Encode: produce the compact reference form of a matched node. */
	toRef: (node: Record<string, unknown>) => JsonUrlValue;
	/**
	 * Decode: handed every record node; return a rehydrated replacement, or the
	 * node unchanged when this resolver does not own that reference. May be async.
	 */
	fromRef: (node: Record<string, unknown>) => JsonUrlValue | Promise<JsonUrlValue>;
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
	createResolverReferenceTransform(options: ResolverReferenceTransformOptions): ShareTransform;
	createKeyMapTransform(options: KeyMapTransformOptions): ShareTransform;
	createDefaultsTransform(options: DefaultsTransformOptions): ShareTransform;
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
