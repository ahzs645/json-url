// centralize all chunks in one file
export default {
	async msgpack() {
		const module = await import(/* webpackChunkName: "msgpack" */ 'msgpack5');
		const factory = module.default || module;
		return factory();
	},
	async safe64() {
		const module = await import(/* webpackChunkName: "safe64" */ 'urlsafe-base64');
		return module.default || module;
	},
	async lzma() {
		const lzma = await import(/* webpackChunkName: "lzma" */ 'lzma');

		// this special condition is present because the web minified version has a slightly different export
		return lzma.compress ? lzma : lzma.LZMA;
	},
	async lzstring() {
		const module = await import(/* webpackChunkName: "lzstring" */ 'lz-string');
		return module.default || module;
	},
	async lzw() {
		const module = await import(/* webpackChunkName: "lzw" */ 'node-lzw');
		const lzw = module.default || module;
		return lzw;
	},
	async zlib() {
		if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
			return null;
		}

		try {
			const dynamicImport = new Function('specifier', 'return import(specifier)');
			const module = await dynamicImport('node:zlib');
			return module.default || module;
		} catch {
			try {
				const dynamicRequire = new Function('return typeof require !== "undefined" ? require : null');
				const requireFn = dynamicRequire();
				if (!requireFn) return null;
				return requireFn('zlib');
			} catch {
				return null;
			}
		}
	}
};
