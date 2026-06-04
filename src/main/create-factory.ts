import { cleanEncodedInput } from './decode-utils.js';
import { createReferenceTransform } from './reference-transform.js';

import type {
	CreateEngineOptions,
	CreateNamedCodecOptions,
	EngineClient,
	JsonUrlFactory,
	JsonUrlValue,
	NamedCodecClient
} from './types.js';

interface JsonUrlRuntime {
	AVAILABLE_CODECS: readonly string[];
	DEFAULT_WEB_SHARE_CODECS: readonly string[];
	DEFAULT_WEB_SHARE_MAX_LENGTH: number;
	DEFAULT_WEB_SHARE_VERSION: string;
	createEngine<TValue = JsonUrlValue>(options?: CreateEngineOptions): EngineClient<TValue>;
	createNamedCodec<TValue = JsonUrlValue>(
		algorithm: string,
		options?: CreateNamedCodecOptions
	): NamedCodecClient<TValue>;
	createWebShareEngine<TValue = JsonUrlValue>(
		options?: CreateEngineOptions
	): EngineClient<TValue>;
}

export function createJsonUrlFactory(runtime: JsonUrlRuntime): JsonUrlFactory {
	return Object.assign(
		function createClient<TValue = JsonUrlValue>(
			algorithm: string,
			options: CreateNamedCodecOptions = {}
		) {
			return runtime.createNamedCodec<TValue>(algorithm, options);
		},
		{
			availableCodecs: runtime.AVAILABLE_CODECS,
			cleanEncodedInput,
			defaultWebShareCodecs: runtime.DEFAULT_WEB_SHARE_CODECS,
			defaultWebShareMaxLength: runtime.DEFAULT_WEB_SHARE_MAX_LENGTH,
			defaultWebShareVersion: runtime.DEFAULT_WEB_SHARE_VERSION,
			createReferenceTransform,
			createEngine: runtime.createEngine,
			createNamedCodec: runtime.createNamedCodec,
			createWebShareEngine: runtime.createWebShareEngine
		}
	) as JsonUrlFactory;
}
