import type {
	DefaultsTransformOptions,
	DefaultValue,
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
	into: string[];
	defaults: Array<[string, DefaultValue]>;
	pruneEmptyInto: boolean;
	dropWhen?: (target: Record<string, unknown>) => boolean;
}

function resolveDefault(spec: DefaultValue, target: Record<string, unknown>): JsonUrlValue {
	return typeof spec === 'function' ? spec(target) : spec;
}

function hasOwn(target: Record<string, unknown>, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(target, key);
}

// Navigate `node` down `into` (a key path). Returns the target record, or null when
// any segment is missing or non-record (used on encode, where a missing target is skipped).
function navigate(node: Record<string, unknown>, into: string[]): Record<string, unknown> | null {
	let current: JsonUrlValue = node;
	for (const segment of into) {
		if (!isRecord(current)) return null;
		current = current[segment];
	}
	return isRecord(current) ? current : null;
}

// Navigate down `into`, creating empty records for missing segments (used on decode so a
// stripped/dropped sub-object is recreated before its defaults are restored).
function ensurePath(node: Record<string, unknown>, into: string[]): Record<string, unknown> {
	let current = node;
	for (const segment of into) {
		if (!isRecord(current[segment])) current[segment] = {};
		current = current[segment] as Record<string, unknown>;
	}
	return current;
}

function deleteLeaf(node: Record<string, unknown>, into: string[]): void {
	let parent: JsonUrlValue = node;
	for (let i = 0; i < into.length - 1; i++) {
		if (!isRecord(parent)) return;
		parent = parent[into[i]];
	}
	if (isRecord(parent)) delete parent[into[into.length - 1]];
}

/**
 * Reversible "strip known defaults" transform. On encode, any key whose value is
 * deep-equal to its configured default is removed; on decode, an absent key is
 * restored to a clone of that default. Stripping and restoring are exact inverses,
 * so the round-trip is lossless while the token only carries non-default data.
 *
 * A rule with no `match` applies to the top-level value only; a rule with `match`
 * applies to every record node where the predicate returns true. `into` descends a
 * key path before applying defaults (the sub-object is created on decode so its
 * defaults can be restored); `pruneEmptyInto` drops the sub-object if it becomes
 * empty on encode; `dropWhen(target)` drops the whole `into` sub-object on encode
 * (it is restored in full from the defaults on decode). `{}` / `[]` defaults double
 * as empty-container pruning.
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
		if (typeof rule.into !== 'undefined' && typeof rule.into !== 'string') {
			throw new Error(`Defaults rule at index ${index} into must be a dot-separated string`);
		}
		if (typeof rule.dropWhen !== 'undefined' && typeof rule.dropWhen !== 'function') {
			throw new Error(`Defaults rule at index ${index} dropWhen must be a function`);
		}
		const into = rule.into ? rule.into.split('.').filter(Boolean) : [];
		if (rule.dropWhen && into.length === 0) {
			throw new Error(`Defaults rule at index ${index} dropWhen requires an into path`);
		}
		return {
			match: rule.match,
			into,
			defaults: Object.entries(rule.defaults),
			pruneEmptyInto: rule.pruneEmptyInto === true,
			dropWhen: rule.dropWhen
		};
	});

	function applies(rule: NormalizedRule, node: Record<string, unknown>, isRoot: boolean): boolean {
		return rule.match ? rule.match(node) : isRoot;
	}

	function stripNode(node: Record<string, unknown>, isRoot: boolean): void {
		for (const rule of rules) {
			if (!applies(rule, node, isRoot)) continue;
			const target = navigate(node, rule.into);
			if (!target) continue;
			if (rule.dropWhen && rule.dropWhen(target)) {
				deleteLeaf(node, rule.into);
				continue;
			}
			for (const [key, spec] of rule.defaults) {
				if (hasOwn(target, key) && equals(target[key], resolveDefault(spec, target))) {
					delete target[key];
				}
			}
			if (rule.into.length > 0 && rule.pruneEmptyInto && Object.keys(target).length === 0) {
				deleteLeaf(node, rule.into);
			}
		}
	}

	function restoreNode(node: Record<string, unknown>, isRoot: boolean): void {
		for (const rule of rules) {
			if (!applies(rule, node, isRoot)) continue;
			const target = ensurePath(node, rule.into);
			for (const [key, spec] of rule.defaults) {
				if (!hasOwn(target, key)) {
					target[key] = clone(resolveDefault(spec, target));
				}
			}
		}
	}

	function walk(
		value: JsonUrlValue,
		visit: (node: Record<string, unknown>, isRoot: boolean) => void,
		isRoot: boolean
	): void {
		if (Array.isArray(value)) {
			for (const entry of value) walk(entry, visit, false);
			return;
		}
		if (!isRecord(value)) return;
		visit(value, isRoot);
		for (const key of Object.keys(value)) walk(value[key], visit, false);
	}

	const transform: ShareTransform = {
		id,
		encode(value) {
			const cloned = clone(value);
			walk(cloned, stripNode, true);
			return cloned;
		}
	};

	if (restore) {
		transform.decode = (value) => {
			const cloned = clone(value);
			walk(cloned, restoreNode, true);
			return cloned;
		};
	}

	return transform;
}
