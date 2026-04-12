export function resolveDefaultExport<T>(module: T | { default: T }): T {
	return (module as { default?: T }).default || (module as T);
}
