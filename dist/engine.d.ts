import type { CreateEngineOptions, CreateNamedCodecOptions, EngineClient, JsonUrlValue, NamedCodecClient } from './types.js';
declare const AVAILABLE_CODECS: readonly string[];
declare const DEFAULT_WEB_SHARE_CODECS: readonly string[];
declare const DEFAULT_WEB_SHARE_VERSION = "1";
declare const DEFAULT_WEB_SHARE_MAX_LENGTH = 12000;
export declare function createNamedCodec<TValue = JsonUrlValue>(algorithm: string, options?: CreateNamedCodecOptions): NamedCodecClient<TValue>;
export declare function createEngine<TValue = JsonUrlValue>(options?: CreateEngineOptions): EngineClient<TValue>;
export declare function createWebShareEngine<TValue = JsonUrlValue>(options?: CreateEngineOptions): EngineClient<TValue>;
export { AVAILABLE_CODECS, DEFAULT_WEB_SHARE_CODECS, DEFAULT_WEB_SHARE_MAX_LENGTH, DEFAULT_WEB_SHARE_VERSION };
//# sourceMappingURL=engine.d.ts.map