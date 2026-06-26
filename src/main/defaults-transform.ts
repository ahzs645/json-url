import type {
	DefaultsRule,
	DefaultsTransformOptions,
	JsonUrlValue,
	ShareTransform
} from './types.js';

function isRecord(value: JsonUrlValue): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function structuralEquals(a: JsonUrlValue, b: JsonUrlValue): boolean {
	if (Object.is(a, b)) return true;
	if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b)) {
		return a === b;
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!structuralEquals(a[i], b[i])) return false;
		}
		return true;
	}
	if (isRecord(a) && isRecord(b)) {
		const aKeys = Object.keys(a);
		const bKeys = Object.keys(b);
		if (aKeys.length !== bKeys.length) return false;
		for (const key of aKeys) {
			if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
			if (!structuralEquals(a[key], b[key])) return false;
		}
		return true;
	}
	return false;
}

function cloneJsonValue<TValue>(value: TValue): TValue {
	if (value === null || typeof value !== 'object') return value;
	if (typeof structuredClone === 'function') return structuredClone(value);
	return JSON.parse(JSON.stringify(value)) as TValue;
}

interface NormalizedRule {
	match?: (node: Record<string, unknown>) => boolean;
	defaults: Array<[string, DefaultsRule['defaults'][string]]>;
}

function resolveDefault(
	spec: DefaultsRule['defaults'][string],
	node: Record<string, unknown>
): JsonUrlValue {
	return typeof spec === 'function' ? spec(node) : spec;
}

/**
 * Reversible "strip known defaults" transform. On encode, any key whose value is
 * deep-equal to its configured default is removed; on decode, an absent key is
 * restored to a clone of that default. This is the declarative replacement for
 * hand-written `if (value === DEFAULT) delete value` / `value ??= DEFAULT` pairs,
 * and it doubles as an empty-container pruner (use `{}` / `[]` as the default).
 *
 * A rule with no `match` applies to the top-level value only (when it is a
 * record). A rule with `match` applies to every record node in the tree where
 * `match(node)` returns true, so callers supply a precise predicate (e.g. keyed
 * off a stable discriminator such as `type`) to avoid touching unrelated nodes.
 */
export function createDefaultsTransform(options: DefaultsTransformOptions): ShareTransform {
	if (!options || !Array.isArray(options.rules)) {
		throw new Error('Defaults transform requires a rules array');
	}

	const id = typeof options.id === 'string' && options.id.trim() ? options.id.trim() : 'defaults';
	const restore = options.restore !== false;
	const equals = typeof options.equals === 'function' ? options.equals : structuralEquals;
	const clone = typeof options.clone === 'function' ? options.clone : cloneJsonValue;

	const rules: NormalizedRule[] = options.rules.map((rule, index) => {
		if (!rule || !isRecord(rule.defaults)) {
			throw new Error(`Defaults rule at index ${index} must provide a defaults object`);
		}
		if (typeof rule.match !== 'undefined' && typeof rule.match !== 'function') {
			throw new Error(`Defaults rule at index ${index} match must be a function when provided`);
		}
		return { match: rule.match, defaults: Object.entries(rule.defaults) };
	});

	function applicableRules(node: Record<string, unknown>, isRoot: boolean): NormalizedRule[] {
		return rules.filter((rule) => (rule.match ? rule.match(node) : isRoot));
	}

	function stripNode(node: Record<string, unknown>, isRoot: boolean): Record<string, unknown> {
		const out: Record<string, unknown> = { ...node };
		for (const rule of applicableRules(node, isRoot)) {
			for (const [key, spec] of rule.defaults) {
				if (!Object.prototype.hasOwnProperty.call(out, key)) continue;
				if (equals(out[key], resolveDefault(spec, out))) {
					delete out[key];
				}
			}
		}
		return out;
	}

	function restoreNode(node: Record<string, unknown>, isRoot: boolean): Record<string, unknown> {
		const out: Record<string, unknown> = { ...node };
		for (const rule of applicableRules(node, isRoot)) {
			for (const [key, spec] of rule.defaults) {
				if (Object.prototype.hasOwnProperty.call(out, key)) continue;
				out[key] = clone(resolveDefault(spec, out));
			}
		}
		return out;
	}

	function walk(
		value: JsonUrlValue,
		visit: (node: Record<string, unknown>, isRoot: boolean) => Record<string, unknown>,
		isRoot: boolean
	): JsonUrlValue {
		if (Array.isArray(value)) {
			return value.map((entry) => walk(entry, visit, false));
		}
		if (!isRecord(value)) return value;
		const visited = visit(value, isRoot);
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(visited)) {
			out[key] = walk(visited[key], visit, false);
		}
		return out;
	}

	const transform: ShareTransform = {
		id,
		encode(value) {
			return walk(value, stripNode, true);
		}
	};

	if (restore) {
		transform.decode = (value) => walk(value, restoreNode, true);
	}

	return transform;
}
