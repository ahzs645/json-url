import type createMsgPack from 'msgpack5';
import type { MsgPackInstance } from 'msgpack5';
import type urlsafeBase64 from 'urlsafe-base64';

import { resolveDefaultExport } from './resolve-default-export.js';

interface CoreLoaderMap {
	msgpack(): Promise<MsgPackInstance>;
	safe64(): Promise<typeof urlsafeBase64>;
	zlib(): Promise<typeof import('node:zlib') | null>;
}

let msgpackPromise: Promise<MsgPackInstance> | null = null;
let safe64Promise: Promise<typeof urlsafeBase64> | null = null;
let zlibPromise: Promise<typeof import('node:zlib') | null> | null = null;

const CORE_LOADERS: CoreLoaderMap = {
	msgpack() {
		msgpackPromise ??= import('msgpack5').then((module) => {
			const factory = resolveDefaultExport<typeof createMsgPack>(module);
			return factory();
		});
		return msgpackPromise;
	},
	safe64() {
		safe64Promise ??= import('urlsafe-base64').then((module) =>
			resolveDefaultExport<typeof urlsafeBase64>(module)
		);
		return safe64Promise;
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
