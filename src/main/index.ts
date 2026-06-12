import { cleanEncodedInput } from './decode-utils.js';
import { createKeyMapTransform } from './key-map-transform.js';
import { createReferenceTransform } from './reference-transform.js';
import { buildShareUrl, extractTokenFromUrl } from './url-utils.js';
import {
	AVAILABLE_CODECS,
	DEFAULT_WEB_SHARE_CODECS,
	DEFAULT_WEB_SHARE_MAX_LENGTH,
	DEFAULT_WEB_SHARE_VERSION,
	createEngine,
	createNamedCodec,
	createWebShareEngine
} from './engine.js';

import type { JsonUrlFactory } from './types.js';

const createClient = Object.assign(
	function createClient(algorithm: string, options = {}) {
		return createNamedCodec(algorithm, options);
	},
	{
		availableCodecs: AVAILABLE_CODECS,
		cleanEncodedInput,
		defaultWebShareCodecs: DEFAULT_WEB_SHARE_CODECS,
		defaultWebShareMaxLength: DEFAULT_WEB_SHARE_MAX_LENGTH,
		defaultWebShareVersion: DEFAULT_WEB_SHARE_VERSION,
		createReferenceTransform,
		createKeyMapTransform,
		buildShareUrl,
		extractTokenFromUrl,
		createEngine,
		createNamedCodec,
		createWebShareEngine
	}
) as JsonUrlFactory;

export type {
	CodecAlgorithmConfig,
	CodecCandidateStats,
	CreateEngineOptions,
	CreateNamedCodecOptions,
	DecodeOptions,
	EngineClient,
	EngineCompressResult,
	JsonUrlFactory,
	JsonUrlValue,
	KeyMapTransformOptions,
	NamedCodecClient,
	NamedCodecStats,
	ReferenceTransformEntry,
	ReferenceTransformOptions,
	ShareCodecDefinition,
	ShareTransform,
	UrlShareLocation,
	UrlShareOptions
} from './types.js';

export default createClient;
