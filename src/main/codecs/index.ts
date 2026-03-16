import type { CodecAlgorithmConfig } from '../types.js';

export type CodecAlgorithmLoader = () => Promise<CodecAlgorithmConfig>;

const ALGORITHMS: Record<string, CodecAlgorithmLoader> = {
	lzma: async () => (await import('./lzma.js')).default,
	lzstring: async () => (await import('./lzstring.js')).default,
	lzw: async () => (await import('./lzw.js')).default,
	pack: async () => (await import('./pack.js')).default,
	raw: async () => (await import('./raw.js')).default,
	gz: async () => (await import('./gz.js')).default,
	df: async () => (await import('./df.js')).default,
	zl: async () => (await import('./zl.js')).default,
	br: async () => (await import('./br.js')).default,
	lz: async () => (await import('./lz.js')).default
};

export default ALGORITHMS;
