//#region src/main/core-loaders.ts
function e(e) {
	return e.default || e;
}
var t = {
	async msgpack() {
		return e(await import("msgpack5"))();
	},
	async safe64() {
		return e(await import("urlsafe-base64"));
	},
	async zlib() {
		if (typeof process > "u" || !process.versions?.node) return null;
		try {
			return e(await import("node:zlib"));
		} catch {
			try {
				let e = Function("return typeof require !== \"undefined\" ? require : null")();
				return e ? e("zlib") : null;
			} catch {
				return null;
			}
		}
	}
};
//#endregion
//#region src/main/codecs/stream-codec.ts
function n(e) {
	return e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
}
function r(e, t, n) {
	let r = Error(t);
	return r.code = "ERR_UNSUPPORTED_CODEC", r.codec = e, n !== void 0 && (r.cause = n), r;
}
async function i(e, t) {
	if (typeof CompressionStream > "u" || typeof Blob > "u" || typeof Response > "u") return null;
	try {
		let r = new Blob([n(e)]).stream().pipeThrough(new CompressionStream(t)), i = await new Response(r).arrayBuffer();
		return new Uint8Array(i);
	} catch {
		return null;
	}
}
async function a(e, t) {
	if (typeof DecompressionStream > "u" || typeof Blob > "u" || typeof Response > "u") return null;
	try {
		let r = new Blob([n(e)]).stream().pipeThrough(new DecompressionStream(t)), i = await new Response(r).arrayBuffer();
		return new Uint8Array(i);
	} catch {
		return null;
	}
}
var o = 6, s = 11;
function c(e, t, n) {
	let r = { level: o };
	switch (t) {
		case "gzip": return n.gzipSync(e, r);
		case "deflate": return n.deflateSync(e, r);
		case "deflate-raw": return n.deflateRawSync(e, r);
		case "brotli": return typeof n.brotliCompressSync == "function" ? n.brotliCompressSync(e, { params: { [n.constants.BROTLI_PARAM_QUALITY]: s } }) : null;
		default: return null;
	}
}
function l(e, t, n) {
	switch (t) {
		case "gzip": return n.gunzipSync(e);
		case "deflate": return n.inflateSync(e);
		case "deflate-raw": return n.inflateRawSync(e);
		case "brotli": return typeof n.brotliDecompressSync == "function" ? n.brotliDecompressSync(e) : null;
		default: return null;
	}
}
async function u(e, n, a) {
	let o = new TextEncoder().encode(e), s = await t.zlib();
	if (s) {
		let e = c(o, n, s);
		if (e) return e;
	}
	let l = await i(o, n);
	if (l) return l;
	throw r(a, `Codec "${a}" is not supported in this environment.`);
}
async function d(e, n, i) {
	let o = e, s = await t.zlib();
	if (s) {
		let e = l(o, n, s);
		if (e) return new TextDecoder().decode(e);
	}
	let c = await a(o, n);
	if (c) return new TextDecoder().decode(c);
	throw r(i, `Codec "${i}" cannot be decoded in this environment.`);
}
//#endregion
export { t as i, r as n, d as r, u as t };

//# sourceMappingURL=stream-codec-BflxNGHP.js.map