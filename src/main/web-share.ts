import { createWebShareEngine } from './full-runtime.js';

import type { CreateEngineOptions, EngineClient, JsonUrlValue } from './types.js';

function createWebShareEngineEntry<TValue = JsonUrlValue>(
	options: CreateEngineOptions = {}
): EngineClient<TValue> {
	return createWebShareEngine<TValue>(options);
}

export default createWebShareEngineEntry;
