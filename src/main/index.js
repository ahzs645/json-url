import { AVAILABLE_CODECS, createEngine, createNamedCodec } from 'main/engine';

const createClient = Object.assign(
	function createClient(algorithm, options = {}) {
		return createNamedCodec(algorithm, options);
	},
	{
		availableCodecs: AVAILABLE_CODECS,
		createEngine,
		createNamedCodec
	}
);

export default createClient;
