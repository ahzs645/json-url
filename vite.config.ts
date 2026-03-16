import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

import packageJson from './package.json';

const dependencyNames = Object.keys(packageJson.dependencies ?? {});

export default defineConfig({
	build: {
		target: 'es2020',
		outDir: 'dist',
		emptyOutDir: false,
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/main/index.ts'),
			name: 'JsonUrl',
			formats: ['es', 'cjs'],
			fileName(format) {
				return format === 'es' ? 'index.js' : 'index.cjs';
			}
		},
		rollupOptions: {
			external: dependencyNames,
			output: {
				exports: 'default'
			}
		}
	},
	test: {
		environment: 'node',
		include: ['test/**/*.test.ts']
	}
});
