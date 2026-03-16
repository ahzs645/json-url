interface LzStringApi {
    compressToEncodedURIComponent(input: string): string;
    decompressFromEncodedURIComponent(input: string): string | null;
    compressToUint8Array(input: string): Uint8Array;
    decompressFromUint8Array(input: Uint8Array): string;
}
export declare function loadLzString(): Promise<LzStringApi>;
export {};
//# sourceMappingURL=load-lzstring.d.ts.map