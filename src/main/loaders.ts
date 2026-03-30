import type createMsgPack from 'msgpack5';
import type { MsgPackInstance } from 'msgpack5';
import type { LzmaApi } from 'lzma';
import type urlsafeBase64 from 'urlsafe-base64';
import type lzwModule from 'node-lzw';

function resolveDefaultExport<T>(module: T | { default: T }): T {
	return (module as { default?: T }).default || (module as T);
}

interface LzmaExport extends LzmaApi {
	LZMA?: LzmaApi;
}

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

const LOADERS: LoaderMap = {
	async msgpack() {
		const module = await import('msgpack5');
		const factory = resolveDefaultExport<typeof createMsgPack>(module);
		return factory();
	},
	async safe64() {
		const module = await import('urlsafe-base64');
		return resolveDefaultExport<typeof urlsafeBase64>(module);
	},
	async lzma() {
		const module = await import('lzma');
		const resolved = resolveDefaultExport<LzmaExport>(module);

		return typeof resolved.compress === 'function' ? resolved : resolved.LZMA!;
	},
	async lzstring() {
		const module = await import('lz-string');
		return resolveDefaultExport<LzStringApi>(module);
	},
	async lzw() {
		const module = await import('node-lzw');
		return resolveDefaultExport<typeof lzwModule>(module);
	},
	async zlib() {
		if (typeof process === 'undefined' || !process.versions?.node) {
			return null;
		}

		try {
			const specifier = 'node:zlib';
			const module = await import(/* @vite-ignore */ specifier);
			return resolveDefaultExport(module as typeof import('node:zlib'));
		} catch {
			try {
				const requireFn = typeof require !== 'undefined' ? require : null;
				if (!requireFn) return null;
				return requireFn('zlib') as typeof import('node:zlib');
			} catch {
				return null;
			}
		}
	}
};

export default LOADERS;
