import type createMsgPack from 'msgpack5';
import type { MsgPackInstance } from 'msgpack5';

import { resolveDefaultExport } from './resolve-default-export.js';
import safe64 from './safe64.js';

interface CoreLoaderMap {
	msgpack(): Promise<MsgPackInstance>;
	safe64(): Promise<typeof safe64>;
	zlib(): Promise<typeof import('node:zlib') | null>;
}

let msgpackPromise: Promise<MsgPackInstance> | null = null;
let zlibPromise: Promise<typeof import('node:zlib') | null> | null = null;

const CORE_LOADERS: CoreLoaderMap = {
	msgpack() {
		msgpackPromise ??= import('msgpack5').then((module) => {
			const factory = resolveDefaultExport<typeof createMsgPack>(module);
			return factory();
		});
		return msgpackPromise;
	},
	// Kept async so callers do not change, but there is nothing to load any more: base64url is a
	// few lines, and the package that used to provide it could not run in a browser.
	safe64() {
		return Promise.resolve(safe64);
	},
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
