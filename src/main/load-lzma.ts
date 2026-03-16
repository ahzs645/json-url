import type { LzmaApi } from 'lzma';

function resolveDefaultExport<T>(module: T | { default: T }): T {
	return (module as { default?: T }).default || (module as T);
}

interface LzmaExport extends LzmaApi {
	LZMA?: LzmaApi;
}

export async function loadLzma(): Promise<LzmaApi> {
	const module = await import('lzma');
	const resolved = resolveDefaultExport<LzmaExport>(module);
	return typeof resolved.compress === 'function' ? resolved : resolved.LZMA!;
}
