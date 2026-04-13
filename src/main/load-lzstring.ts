import { resolveDefaultExport } from './resolve-default-export.js';

interface LzStringApi {
	compressToEncodedURIComponent(input: string): string;
	decompressFromEncodedURIComponent(input: string): string | null;
	compressToUint8Array(input: string): Uint8Array;
	decompressFromUint8Array(input: Uint8Array): string;
}

let cached: Promise<LzStringApi> | null = null;

export function loadLzString(): Promise<LzStringApi> {
	cached ??= import('lz-string').then((module) =>
		resolveDefaultExport<LzStringApi>(module)
	);
	return cached;
}
