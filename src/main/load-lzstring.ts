interface LzStringApi {
	compressToEncodedURIComponent(input: string): string;
	decompressFromEncodedURIComponent(input: string): string | null;
	compressToUint8Array(input: string): Uint8Array;
	decompressFromUint8Array(input: Uint8Array): string;
}

function resolveDefaultExport<T>(module: T | { default: T }): T {
	return (module as { default?: T }).default || (module as T);
}

export async function loadLzString(): Promise<LzStringApi> {
	const module = await import('lz-string');
	return resolveDefaultExport<LzStringApi>(module);
}
