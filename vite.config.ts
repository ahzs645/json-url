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
			entry: {
				index: resolve(__dirname, 'src/main/index.ts'),
				'web-share': resolve(__dirname, 'src/main/web-share.ts')
			},
			name: 'JsonUrl',
			formats: ['es', 'cjs'],
			fileName(format, entryName) {
				const extension = format === 'es' ? 'js' : 'cjs';
				return `${entryName}.${extension}`;
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
