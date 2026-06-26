import { cleanEncodedInput } from './decode-utils.js';
import { createDefaultsTransform } from './defaults-transform.js';
import { createKeyMapTransform } from './key-map-transform.js';
import { createNumberPrecisionTransform } from './number-precision-transform.js';
import { createReferenceTransform } from './reference-transform.js';
import { createResolverReferenceTransform } from './resolver-reference-transform.js';
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
		createResolverReferenceTransform,
		createKeyMapTransform,
		createDefaultsTransform,
		createNumberPrecisionTransform,
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
	DefaultsRule,
	DefaultsTransformOptions,
	DefaultValue,
	EngineClient,
	EngineCompressResult,
	JsonUrlFactory,
	JsonUrlValue,
	KeyMapTransformOptions,
	NamedCodecClient,
	NamedCodecStats,
	NumberPrecisionTransformOptions,
	ReferenceTransformEntry,
	ReferenceTransformOptions,
	ResolverReferenceTransformOptions,
	ShareCodecDefinition,
	ShareTransform,
	UrlShareLocation,
	UrlShareOptions
} from './types.js';

export default createClient;
