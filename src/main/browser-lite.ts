import { createJsonUrlFactory } from './create-factory.js';
import {
	AVAILABLE_CODECS,
	DEFAULT_WEB_SHARE_CODECS,
	DEFAULT_WEB_SHARE_MAX_LENGTH,
	DEFAULT_WEB_SHARE_VERSION,
	createEngine,
	createNamedCodec,
	createWebShareEngine
} from './lite-runtime.js';

const createClient = createJsonUrlFactory({
	AVAILABLE_CODECS,
	DEFAULT_WEB_SHARE_CODECS,
	DEFAULT_WEB_SHARE_MAX_LENGTH,
	DEFAULT_WEB_SHARE_VERSION,
	createEngine,
	createNamedCodec,
	createWebShareEngine
});

export default createClient;
