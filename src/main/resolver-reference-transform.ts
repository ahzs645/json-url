import type {
	JsonUrlValue,
	ResolverReferenceTransformOptions,
	ShareTransform
} from './types.js';

function isRecord(value: JsonUrlValue): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Resolver-based reference transform. Unlike {@link createReferenceTransform},
 * which swaps values against a fixed up-front dictionary, this variant lets the
 * caller compact a node into a compact reference on encode and rehydrate it from
 * an arbitrary (possibly async) resolver on decode — e.g. a browser library, a
 * seed catalogue, or remote storage. The substitution machinery (recursive walk,
 * match/skip plumbing, async ordering) lives here; the caller supplies only the
 * domain-specific `match` / `toRef` / `fromRef`.
 *
 * `match` identifies an embedded node to compact; `toRef` returns its compact
 * form; `fromRef` is handed every record node on decode and returns a rehydrated
 * replacement (or the node unchanged when it does not own that reference).
 */
export function createResolverReferenceTransform(
	options: ResolverReferenceTransformOptions
): ShareTransform {
	if (!options || typeof options !== 'object') {
		throw new Error('Resolver reference transform requires an options object');
	}
	const { match, toRef, fromRef } = options;
	if (typeof match !== 'function' || typeof toRef !== 'function') {
		throw new Error('Resolver reference transform requires match and toRef functions');
	}
	if (typeof fromRef !== 'function') {
		throw new Error('Resolver reference transform requires a fromRef function');
	}

	const id =
		typeof options.id === 'string' && options.id.trim() ? options.id.trim() : 'resolver-reference';

	async function walk(
		value: JsonUrlValue,
		visit: (node: Record<string, unknown>) => JsonUrlValue | Promise<JsonUrlValue>
	): Promise<JsonUrlValue> {
		if (Array.isArray(value)) {
			const out: JsonUrlValue[] = [];
			for (const entry of value) {
				out.push(await walk(entry, visit));
			}
			return out;
		}
		if (!isRecord(value)) return value;

		const visited = await visit(value);
		if (!isRecord(visited)) {
			// A leaf replacement (e.g. a primitive ref) — nothing further to descend.
			return Array.isArray(visited) ? await walk(visited, visit) : visited;
		}

		const out: Record<string, unknown> = {};
		for (const key of Object.keys(visited)) {
			out[key] = await walk(visited[key], visit);
		}
		return out;
	}

	return {
		id,
		encode(value) {
			return walk(value, (node) => (match(node) ? toRef(node) : node));
		},
		decode(value) {
			return walk(value, (node) => fromRef(node));
		}
	};
}
