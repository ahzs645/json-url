import type lzwModule from 'node-lzw';

function resolveDefaultExport<T>(module: T | { default: T }): T {
	return (module as { default?: T }).default || (module as T);
}

export async function loadLzw(): Promise<typeof lzwModule> {
	const module = await import('node-lzw');
	return resolveDefaultExport<typeof lzwModule>(module);
}
