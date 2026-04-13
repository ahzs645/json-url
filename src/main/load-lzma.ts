import type { LzmaApi } from 'lzma';

import { resolveDefaultExport } from './resolve-default-export.js';

interface LzmaExport extends LzmaApi {
	LZMA?: LzmaApi;
}

let cached: Promise<LzmaApi> | null = null;

export function loadLzma(): Promise<LzmaApi> {
	cached ??= import('lzma').then((module) => {
		const resolved = resolveDefaultExport<LzmaExport>(module);
		return typeof resolved.compress === 'function' ? resolved : resolved.LZMA!;
	});
	return cached;
}
