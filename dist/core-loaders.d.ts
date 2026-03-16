import type { MsgPackInstance } from 'msgpack5';
import type urlsafeBase64 from 'urlsafe-base64';
interface CoreLoaderMap {
    msgpack(): Promise<MsgPackInstance>;
    safe64(): Promise<typeof urlsafeBase64>;
    zlib(): Promise<typeof import('node:zlib') | null>;
}
declare const CORE_LOADERS: CoreLoaderMap;
export default CORE_LOADERS;
//# sourceMappingURL=core-loaders.d.ts.map