import { Buffer as e } from "buffer";
//#region src/main/decode-utils.ts
function t(e) {
	let t = "", n = 0, r = 0, i;
	for (; n < e.length;) i = e.charCodeAt(n), i === 37 ? (n > r && (t += e.slice(r, n)), e = decodeURIComponent(e.slice(n)), n = 0, r = 0) : i === 32 || i === 10 || i === 13 || i === 0 || i === 8232 || i === 8233 ? (n > r && (t += e.slice(r, n)), n += 1, r = n) : n += 1;
	return n > r && (t += e.slice(r, n)), t;
}
function n(e = {}) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error("Expected decode options to be an object");
	return { deURI: e.deURI === !0 };
}
function r(e, r = {}) {
	if (typeof e != "string") throw Error("Expected encoded input to be a string");
	let { deURI: i } = n(r);
	return i ? t(e) : e;
}
//#endregion
//#region src/main/loaders.ts
function i(e) {
	return e.default || e;
}
var a = {
	async msgpack() {
		return i(await import("msgpack5"))();
	},
	async safe64() {
		return i(await import("urlsafe-base64"));
	},
	async lzma() {
		let e = i(await import("lzma"));
		return typeof e.compress == "function" ? e : e.LZMA;
	},
	async lzstring() {
		return i(await import("lz-string"));
	},
	async lzw() {
		return i(await import("node-lzw"));
	},
	async zlib() {
		if (typeof process > "u" || !process.versions?.node) return null;
		try {
			return i(await import("node:zlib"));
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
function o(e) {
	return e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
}
function s(e, t, n) {
	let r = Error(t);
	return r.code = "ERR_UNSUPPORTED_CODEC", r.codec = e, n !== void 0 && (r.cause = n), r;
}
async function c(e, t) {
	if (typeof CompressionStream > "u" || typeof Blob > "u" || typeof Response > "u") return null;
	try {
		let n = new Blob([o(e)]).stream().pipeThrough(new CompressionStream(t)), r = await new Response(n).arrayBuffer();
		return new Uint8Array(r);
	} catch {
		return null;
	}
}
async function l(e, t) {
	if (typeof DecompressionStream > "u" || typeof Blob > "u" || typeof Response > "u") return null;
	try {
		let n = new Blob([o(e)]).stream().pipeThrough(new DecompressionStream(t)), r = await new Response(n).arrayBuffer();
		return new Uint8Array(r);
	} catch {
		return null;
	}
}
function u(e, t, n) {
	switch (t) {
		case "gzip": return n.gzipSync(e);
		case "deflate-raw": return n.deflateRawSync(e);
		case "brotli": return typeof n.brotliCompressSync == "function" ? n.brotliCompressSync(e) : null;
		default: return null;
	}
}
function d(e, t, n) {
	switch (t) {
		case "gzip": return n.gunzipSync(e);
		case "deflate-raw": return n.inflateRawSync(e);
		case "brotli": return typeof n.brotliDecompressSync == "function" ? n.brotliDecompressSync(e) : null;
		default: return null;
	}
}
async function f(e, t, n) {
	let r = new TextEncoder().encode(e), i = await a.zlib();
	if (i) {
		let e = u(r, t, i);
		if (e) return e;
	}
	let o = await c(r, t);
	if (o) return o;
	throw s(n, `Codec "${n}" is not supported in this environment.`);
}
async function p(e, t, n) {
	let r = e, i = await a.zlib();
	if (i) {
		let e = d(r, t, i);
		if (e) return new TextDecoder().decode(e);
	}
	let o = await l(r, t);
	if (o) return new TextDecoder().decode(o);
	throw s(n, `Codec "${n}" cannot be decoded in this environment.`);
}
//#endregion
//#region src/main/codecs/index.ts
var m = {
	lzma: {
		pack: !0,
		encode: !0,
		async compress(t) {
			let n = e.from(t), r = await a.lzma();
			return new Promise((t, i) => {
				r.compress(n, 9, (n, r) => {
					if (r) {
						i(r);
						return;
					}
					t(e.from(n));
				});
			});
		},
		async decompress(t) {
			let n = e.from(t), r = await a.lzma();
			return new Promise((t, i) => {
				r.decompress(n, (n, r) => {
					if (r) {
						i(r);
						return;
					}
					t(e.from(n));
				});
			});
		}
	},
	lzstring: {
		pack: !1,
		encode: !0,
		async compress(t) {
			return e.from((await a.lzstring()).compressToUint8Array(String(t)));
		},
		async decompress(t) {
			return (await a.lzstring()).decompressFromUint8Array(typeof t == "string" ? new TextEncoder().encode(t) : e.from(t));
		}
	},
	lzw: {
		pack: !0,
		encode: !0,
		async compress(t) {
			let n = e.from(t);
			return e.from((await a.lzw()).encode(n.toString("binary")));
		},
		async decompress(t) {
			return e.from((await a.lzw()).decode(e.from(t)), "binary");
		}
	},
	pack: {
		pack: !0,
		encode: !0,
		async compress(e) {
			return e;
		},
		async decompress(e) {
			return e;
		}
	},
	raw: {
		pack: !1,
		encode: !0,
		async compress(t) {
			return e.from(typeof t == "string" ? t : e.from(t).toString("utf8"), "utf8");
		},
		async decompress(t) {
			return e.from(typeof t == "string" ? e.from(t, "utf8") : t).toString("utf8");
		}
	},
	gz: {
		pack: !1,
		encode: !0,
		async compress(e) {
			return f(String(e), "gzip", "gz");
		},
		async decompress(e) {
			return p(typeof e == "string" ? new TextEncoder().encode(e) : e, "gzip", "gz");
		}
	},
	df: {
		pack: !1,
		encode: !0,
		async compress(e) {
			return f(String(e), "deflate-raw", "df");
		},
		async decompress(e) {
			return p(typeof e == "string" ? new TextEncoder().encode(e) : e, "deflate-raw", "df");
		}
	},
	br: {
		pack: !1,
		encode: !0,
		async compress(e) {
			return f(String(e), "brotli", "br");
		},
		async decompress(e) {
			return p(typeof e == "string" ? new TextEncoder().encode(e) : e, "brotli", "br");
		}
	},
	lz: {
		pack: !1,
		encode: !1,
		async compress(e) {
			return (await a.lzstring()).compressToEncodedURIComponent(String(e));
		},
		async decompress(e) {
			let t = (await a.lzstring()).decompressFromEncodedURIComponent(String(e));
			if (t === null) throw Error("Unable to decode lz codec payload");
			return t;
		}
	}
}, h = Object.freeze(Object.keys(m)), g = Object.freeze([
	"raw",
	"gz",
	"df",
	"br",
	"lz"
]), _ = 12e3;
function v(e) {
	return Math.floor(e * 1e4) / 1e4;
}
function y(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function b(e, t = "codec") {
	if (typeof e != "string" || !e.trim()) throw Error(`Expected ${t} to have a non-empty string id`);
	let n = e.trim();
	if (n.includes(".")) throw Error(`Expected ${t} id to not contain "."`);
	return n;
}
function x(e = []) {
	if (!e) return [];
	if (!Array.isArray(e)) throw Error("Expected transforms to be an array");
	return e.map((e, t) => {
		if (!y(e)) throw Error(`Transform at index ${t} must be an object`);
		let n = e;
		if (typeof n.encode != "function" && typeof n.decode != "function") throw Error(`Transform at index ${t} must provide encode or decode`);
		return {
			id: typeof n.id == "string" && n.id.trim() ? n.id.trim() : `transform_${t + 1}`,
			encode: n.encode,
			decode: n.decode
		};
	});
}
async function S(e, t, n) {
	let r = n === "encode" ? t : [...t].reverse(), i = e;
	for (let e of r) {
		let t = n === "encode" ? e.encode : e.decode;
		typeof t == "function" && (i = await t(i));
	}
	return i;
}
async function C(e, t) {
	return t.pack ? (await a.msgpack()).encode(e) : JSON.stringify(e);
}
async function w(t, n) {
	return n.pack ? (await a.msgpack()).decode(e.from(t)) : JSON.parse(String(t));
}
async function T(t, n) {
	return n.encode ? (await a.safe64()).encode(typeof t == "string" ? e.from(t, "utf8") : t) : typeof t == "string" ? t : e.from(t).toString("utf8");
}
async function E(e, t) {
	return t.encode ? (await a.safe64()).decode(e) : e;
}
function D(e) {
	let t = b(e, "algorithm");
	if (!Object.prototype.hasOwnProperty.call(m, t)) throw Error(`No such algorithm ${t}`);
	return {
		id: t,
		config: m[t]
	};
}
function O(e, t, n) {
	return `${e}.${t}.${n}`;
}
function k(e) {
	if (typeof e != "string" || !e.trim()) throw Error("Expected token to be a non-empty string");
	let t = e.trim(), n = t.indexOf("."), r = t.indexOf(".", n + 1);
	return n <= 0 || r <= n + 1 ? null : {
		version: t.slice(0, n),
		codecId: t.slice(n + 1, r),
		payload: t.slice(r + 1)
	};
}
function A(e) {
	if (e == null) return Infinity;
	if (typeof e != "number" || !Number.isFinite(e) || e <= 0) throw Error("Expected maxLength to be a positive finite number");
	return Math.floor(e);
}
function j({ rawText: e, transformedText: t, tokenLength: n, codecId: r, token: i }) {
	let a = encodeURIComponent(e).length, o = encodeURIComponent(t).length;
	return {
		codec: r,
		token: i,
		raw: e.length,
		rawencoded: a,
		transformed: t.length,
		transformedencoded: o,
		compressedencoded: n,
		compression: v(a / n)
	};
}
function M(e, t) {
	if (typeof e == "string") {
		let t = P(e);
		return {
			id: t.id,
			client: t
		};
	}
	if (!y(e)) throw Error(`Codec at index ${t} must be a string or codec object`);
	let n = b(String(e.id), `codec at index ${t}`);
	if (typeof e.compress != "function" || typeof e.decompress != "function") throw Error(`Codec "${n}" must provide compress and decompress`);
	return {
		id: n,
		client: e
	};
}
function N(e) {
	return !!e && typeof e == "object" && e.code === "ERR_UNSUPPORTED_CODEC";
}
function P(e, t = {}) {
	let n = x(t.transforms), i = n.map((e) => e.id), { id: a, config: o } = D(e);
	async function s(e) {
		let t = await S(e, n, "encode");
		return {
			transformed: t,
			transformedText: JSON.stringify(t)
		};
	}
	async function c(e) {
		let { transformed: t } = await s(e), n = await C(t, o);
		return T(await o.compress(n), o);
	}
	async function l(e, t = {}) {
		let i = await E(r(e, t), o);
		return await S(await w(await o.decompress(i), o), n, "decode");
	}
	async function u(e, t, n = {}) {
		try {
			return await l(e, n);
		} catch {
			return t;
		}
	}
	async function d(e) {
		let t = JSON.stringify(e), { transformedText: n } = await s(e), r = await c(e);
		return {
			...j({
				rawText: t,
				transformedText: n,
				tokenLength: r.length,
				codecId: a,
				token: r
			}),
			algorithm: a,
			transforms: i
		};
	}
	return {
		id: a,
		compress: c,
		decompress: l,
		tryDecompress: u,
		stats: d,
		transforms: i
	};
}
function F(e = {}) {
	let t = x(e.transforms), n = t.map((e) => e.id), i = (Array.isArray(e.codecs) && e.codecs.length > 0 ? e.codecs : h).map((e, t) => M(e, t)), a = /* @__PURE__ */ new Map(), o = A(e.maxLength), c = e.version === void 0 ? "1" : b(String(e.version), "version"), l = e.skipUnsupportedCodecs === !0, u = typeof e.alwaysPrefix == "boolean" ? e.alwaysPrefix : i.length !== 1, d = e.defaultCodec === void 0 ? i[0]?.id : b(e.defaultCodec, "default codec");
	if (i.forEach((e) => {
		if (a.has(e.id)) throw Error(`Duplicate codec id "${e.id}"`);
		a.set(e.id, e);
	}), !d || !a.has(d)) throw Error(`Unknown default codec "${d}"`);
	async function f(e) {
		let n = await S(e, t, "encode");
		return {
			rawText: JSON.stringify(e),
			transformed: n,
			transformedText: JSON.stringify(n)
		};
	}
	async function p(e) {
		let { rawText: t, transformed: n, transformedText: r } = await f(e), a = encodeURIComponent(t).length, d = encodeURIComponent(r).length, p = [], m = [];
		for (let e of i) try {
			let i = await e.client.compress(n);
			if (typeof i != "string") throw Error(`Codec "${e.id}" returned a non-string token`);
			let o = u ? O(c, e.id, i) : i;
			p.push({
				codec: e.id,
				token: o,
				tokenLength: o.length,
				payloadLength: i.length,
				raw: t.length,
				rawencoded: a,
				transformed: r.length,
				transformedencoded: d,
				compression: v(a / o.length)
			});
		} catch (t) {
			if (!l || !N(t)) throw t;
			m.push({
				codec: e.id,
				reason: t.message
			});
		}
		if (p.length === 0) throw m.length > 0 ? s("engine", `None of the configured codecs are supported in this environment: ${m.map((e) => e.codec).join(", ")}`) : Error("No codec candidates were produced");
		p.sort((e, t) => e.tokenLength - t.tokenLength);
		let h = p[0];
		if (h.tokenLength > o) throw Error(`Encoded token exceeds maxLength (${h.tokenLength} > ${o})`);
		return {
			codec: h.codec,
			token: h.token,
			raw: t.length,
			rawencoded: a,
			transformed: r.length,
			transformedencoded: d,
			compressedencoded: h.tokenLength,
			compression: h.compression,
			candidates: p,
			skipped: m
		};
	}
	async function m(e) {
		return (await p(e)).token;
	}
	async function g(e, n = {}) {
		let o = r(e, n), s = k(o);
		if (s && s.version === c && a.has(s.codecId)) return await S(await a.get(s.codecId).client.decompress(s.payload), t, "decode");
		if (s && (u || i.length > 1)) throw s.version === c ? Error(`Unsupported codec ${s.codecId}`) : Error(`Unsupported token version ${s.version}`);
		if (u || i.length > 1) throw Error("Encoded token is missing a version/codec prefix");
		return await S(await a.get(d).client.decompress(o), t, "decode");
	}
	async function _(e, t, n = {}) {
		try {
			return await g(e, n);
		} catch {
			return t;
		}
	}
	async function y(e) {
		return p(e);
	}
	return {
		version: c,
		codecs: i.map((e) => e.id),
		transforms: n,
		skipUnsupportedCodecs: l,
		compress: m,
		compressBest: p,
		compressDetailed: p,
		decompress: g,
		tryDecompress: _,
		tryDecodeToken: _,
		stats: y
	};
}
function I(e = {}) {
	return F({
		...e,
		version: e.version === void 0 ? "1" : e.version,
		alwaysPrefix: e.alwaysPrefix === void 0 ? !0 : e.alwaysPrefix,
		maxLength: e.maxLength === void 0 ? _ : e.maxLength,
		skipUnsupportedCodecs: e.skipUnsupportedCodecs === void 0 ? !0 : e.skipUnsupportedCodecs,
		codecs: Array.isArray(e.codecs) && e.codecs.length > 0 ? e.codecs : Array.from(g)
	});
}
//#endregion
//#region src/main/index.ts
var L = Object.assign(function(e, t = {}) {
	return P(e, t);
}, {
	availableCodecs: h,
	cleanEncodedInput: t,
	defaultWebShareCodecs: g,
	defaultWebShareMaxLength: _,
	defaultWebShareVersion: "1",
	createEngine: F,
	createNamedCodec: P,
	createWebShareEngine: I
});
//#endregion
export { L as default };

//# sourceMappingURL=index.js.map