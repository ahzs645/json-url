import ALGORITHMS from './codecs/index.js';
import { createJsonUrlRuntime } from './engine.js';
import { loadMsgpack } from './load-msgpack.js';

const runtime = createJsonUrlRuntime({
	algorithms: ALGORITHMS,
	loadMsgpack
});

export const {
	AVAILABLE_CODECS,
	DEFAULT_WEB_SHARE_CODECS,
	DEFAULT_WEB_SHARE_MAX_LENGTH,
	DEFAULT_WEB_SHARE_VERSION,
	createEngine,
	createNamedCodec,
	createWebShareEngine
} = runtime;
