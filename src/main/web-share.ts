import { createWebShareEngine } from './engine.js';
import { createDefaultsTransform } from './defaults-transform.js';
import { createKeyMapTransform } from './key-map-transform.js';
import { createNumberPrecisionTransform } from './number-precision-transform.js';
import { createReferenceTransform } from './reference-transform.js';
import { createResolverReferenceTransform } from './resolver-reference-transform.js';

import type { CreateEngineOptions, EngineClient, JsonUrlValue } from './types.js';

// The web-share entry stays a single default export (the rollup build pins
// `output.exports: 'default'`). To keep the reversible transform factories
// reachable from this lean subpath without pulling the full barrel, they ride
// along as properties of the default export.
const createWebShareEngineEntry = Object.assign(
	function createWebShareEngineEntry<TValue = JsonUrlValue>(
		options: CreateEngineOptions = {}
	): EngineClient<TValue> {
		return createWebShareEngine<TValue>(options);
	},
	{
		createDefaultsTransform,
		createKeyMapTransform,
		createNumberPrecisionTransform,
		createReferenceTransform,
		createResolverReferenceTransform
	}
);

export default createWebShareEngineEntry;
