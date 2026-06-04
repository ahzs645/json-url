import { resolve } from 'node:path';
import { createRequire } from 'node:module';

import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^assert\/?$/,
				replacement: require.resolve('assert/')
			},
			{
				find: /^events\/?$/,
				replacement: require.resolve('events/')
			},
			{
				find: /^util\/?$/,
				replacement: require.resolve('util/')
			}
		]
	},
	build: {
		target: 'es2020',
		outDir: 'dist/browser',
		emptyOutDir: false,
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/main/browser-lite.ts'),
			name: 'JsonUrl',
			formats: ['umd'],
			fileName() {
				return 'json-url-lite.js';
			}
		},
		rollupOptions: {
			output: {
				exports: 'default'
			}
		}
	}
});
