import type createMsgPack from 'msgpack5';
import type { MsgPackInstance } from 'msgpack5';

import { resolveDefaultExport } from './resolve-default-export.js';

let msgpackPromise: Promise<MsgPackInstance> | null = null;

export function loadMsgpack(): Promise<MsgPackInstance> {
	msgpackPromise ??= import('msgpack5').then((module) => {
		const factory = resolveDefaultExport<typeof createMsgPack>(module);
		return factory();
	});
	return msgpackPromise;
}
