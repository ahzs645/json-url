import { resolveDefaultExport } from './resolve-default-export.js';

interface CoreLoaderMap {
	zlib(): Promise<typeof import('node:zlib') | null>;
}

let zlibPromise: Promise<typeof import('node:zlib') | null> | null = null;

const CORE_LOADERS: CoreLoaderMap = {
	zlib() {
		zlibPromise ??= (async () => {
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
		})();
		return zlibPromise;
	}
};

export default CORE_LOADERS;
