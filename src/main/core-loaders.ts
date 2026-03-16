import type createMsgPack from 'msgpack5';
import type { MsgPackInstance } from 'msgpack5';
import type urlsafeBase64 from 'urlsafe-base64';

function resolveDefaultExport<T>(module: T | { default: T }): T {
	return (module as { default?: T }).default || (module as T);
}

interface CoreLoaderMap {
	msgpack(): Promise<MsgPackInstance>;
	safe64(): Promise<typeof urlsafeBase64>;
	zlib(): Promise<typeof import('node:zlib') | null>;
}

const CORE_LOADERS: CoreLoaderMap = {
	async msgpack() {
		const module = await import('msgpack5');
		const factory = resolveDefaultExport<typeof createMsgPack>(module);
		return factory();
	},
	async safe64() {
		const module = await import('urlsafe-base64');
		return resolveDefaultExport<typeof urlsafeBase64>(module);
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
				const dynamicRequire = new Function(
					'return typeof require !== "undefined" ? require : null'
				) as () => ((specifier: string) => typeof import('node:zlib')) | null;
				const requireFn = dynamicRequire();
				if (!requireFn) return null;
				return requireFn('zlib');
			} catch {
				return null;
			}
		}
	}
};

export default CORE_LOADERS;
