import type { MsgPackInstance } from 'msgpack5';
import type { LzmaApi } from 'lzma';
import type urlsafeBase64 from 'urlsafe-base64';
import type lzwModule from 'node-lzw';
interface LzStringApi {
    compressToEncodedURIComponent(input: string): string;
    decompressFromEncodedURIComponent(input: string): string | null;
    compressToUint8Array(input: string): Uint8Array;
    decompressFromUint8Array(input: Uint8Array): string;
}
interface LoaderMap {
    msgpack(): Promise<MsgPackInstance>;
    safe64(): Promise<typeof urlsafeBase64>;
    lzma(): Promise<LzmaApi>;
    lzstring(): Promise<LzStringApi>;
    lzw(): Promise<typeof lzwModule>;
    zlib(): Promise<typeof import('node:zlib') | null>;
}
declare const LOADERS: LoaderMap;
export default LOADERS;
//# sourceMappingURL=loaders.d.ts.map