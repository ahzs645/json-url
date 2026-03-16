const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist', 'esm');

function resolveSpecifier(specifier, filePath) {
	if (specifier.endsWith('.js') || specifier.endsWith('.json') || specifier.endsWith('.mjs')) {
		return specifier;
	}

	const absolute = path.resolve(path.dirname(filePath), specifier);
	if (fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()) {
		return `${specifier}/index.js`;
	}

	return `${specifier}.js`;
}

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const nextPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(nextPath);
			continue;
		}
		if (!entry.isFile() || !nextPath.endsWith('.js')) continue;
		const source = fs.readFileSync(nextPath, 'utf8');
		const rewritten = source.replace(
			/(from\s+["'])(\.\.?\/[^"']+?)(["'])/g,
			(_, prefix, specifier, suffix) => {
				return `${prefix}${resolveSpecifier(specifier, nextPath)}${suffix}`;
			}
		).replace(
			/(import\s*\(\s*["'])(\.\.?\/[^"']+?)(["']\s*\))/g,
			(_, prefix, specifier, suffix) => {
				return `${prefix}${resolveSpecifier(specifier, nextPath)}${suffix}`;
			}
		);

		if (rewritten !== source) {
			fs.writeFileSync(nextPath, rewritten);
		}
	}
}

walk(root);
