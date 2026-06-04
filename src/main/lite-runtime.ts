import LITE_ALGORITHMS from './codecs/lite.js';
import { createJsonUrlRuntime } from './engine.js';

const runtime = createJsonUrlRuntime({
	algorithms: LITE_ALGORITHMS
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
