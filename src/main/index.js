import {
	AVAILABLE_CODECS,
	DEFAULT_WEB_SHARE_CODECS,
	DEFAULT_WEB_SHARE_MAX_LENGTH,
	DEFAULT_WEB_SHARE_VERSION,
	createEngine,
	createNamedCodec,
	createWebShareEngine
} from 'main/engine';

const createClient = Object.assign(
	function createClient(algorithm, options = {}) {
		return createNamedCodec(algorithm, options);
	},
	{
		availableCodecs: AVAILABLE_CODECS,
		defaultWebShareCodecs: DEFAULT_WEB_SHARE_CODECS,
		defaultWebShareMaxLength: DEFAULT_WEB_SHARE_MAX_LENGTH,
		defaultWebShareVersion: DEFAULT_WEB_SHARE_VERSION,
		createEngine,
		createNamedCodec,
		createWebShareEngine
	}
);

export default createClient;
