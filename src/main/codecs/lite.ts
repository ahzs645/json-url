import type { CodecAlgorithmRegistry } from '../types.js';

const LITE_ALGORITHMS: CodecAlgorithmRegistry = {
	raw: async () => (await import('./raw.js')).default,
	gz: async () => (await import('./gz.js')).default,
	hgz: async () => (await import('./hgz.js')).default,
	df: async () => (await import('./df.js')).default,
	zl: async () => (await import('./zl.js')).default,
	br: async () => (await import('./br.js')).default,
	hbr: async () => (await import('./hbr.js')).default,
	lz: async () => (await import('./lz.js')).default
};

export default LITE_ALGORITHMS;
