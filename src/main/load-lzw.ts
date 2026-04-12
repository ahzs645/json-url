import type lzwModule from 'node-lzw';

import { resolveDefaultExport } from './resolve-default-export.js';

let cached: Promise<typeof lzwModule> | null = null;

export function loadLzw(): Promise<typeof lzwModule> {
	cached ??= import('node-lzw').then((module) =>
		resolveDefaultExport<typeof lzwModule>(module)
	);
	return cached;
}
