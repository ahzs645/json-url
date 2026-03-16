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
				find: /^lzma$/,
				replacement: require.resolve('lzma/src/lzma_worker-min.js')
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
			entry: resolve(__dirname, 'src/main/browser.ts'),
			name: 'JsonUrl',
			formats: ['umd'],
			fileName() {
				return 'json-url-single.js';
			}
		},
		rollupOptions: {
			output: {
				exports: 'default'
			}
		}
	}
});
