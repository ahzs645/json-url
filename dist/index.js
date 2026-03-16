import { n as e, t } from "./decode-utils-BMvRxlTb.js";
import { i as n, n as r } from "./stream-codec-D4-Gns2a.js";
import { Buffer as i } from "buffer";
//#region src/main/codecs/index.ts
var a = {
	lzma: async () => (await import("./lzma-B6qVLRSl.js")).default,
	lzstring: async () => (await import("./lzstring-D9FpqWVz.js")).default,
	lzw: async () => (await import("./lzw-DWvkljQM.js")).default,
	pack: async () => (await import("./pack-BMxO0Pu0.js")).default,
	raw: async () => (await import("./raw-aEoG8x84.js").then((e) => e.n)).default,
	gz: async () => (await import("./gz-DTcVIu1M.js").then((e) => e.n)).default,
	df: async () => (await import("./df-BmqYyyJq.js").then((e) => e.n)).default,
	br: async () => (await import("./br-BYKIWxqK.js").then((e) => e.n)).default,
	lz: async () => (await import("./lz-BjJzlp3o.js").then((e) => e.n)).default
}, o = Object.freeze(Object.keys(a)), s = Object.freeze([
	"raw",
	"gz",
	"df",
	"br",
	"lz"
]), c = 12e3;
function l(e) {
	return Math.floor(e * 1e4) / 1e4;
}
function u(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function d(e, t = "codec") {
	if (typeof e != "string" || !e.trim()) throw Error(`Expected ${t} to have a non-empty string id`);
	let n = e.trim();
	if (n.includes(".")) throw Error(`Expected ${t} id to not contain "."`);
	return n;
}
function f(e = []) {
	if (!e) return [];
	if (!Array.isArray(e)) throw Error("Expected transforms to be an array");
	return e.map((e, t) => {
		if (!u(e)) throw Error(`Transform at index ${t} must be an object`);
		let n = e;
		if (typeof n.encode != "function" && typeof n.decode != "function") throw Error(`Transform at index ${t} must provide encode or decode`);
		return {
			id: typeof n.id == "string" && n.id.trim() ? n.id.trim() : `transform_${t + 1}`,
			encode: n.encode,
			decode: n.decode
		};
	});
}
async function p(e, t, n) {
	let r = n === "encode" ? t : [...t].reverse(), i = e;
	for (let e of r) {
		let t = n === "encode" ? e.encode : e.decode;
		typeof t == "function" && (i = await t(i));
	}
	return i;
}
async function m(e, t) {
	return t.pack ? (await n.msgpack()).encode(e) : JSON.stringify(e);
}
async function h(e, t) {
	return t.pack ? (await n.msgpack()).decode(i.from(e)) : JSON.parse(String(e));
}
async function g(e, t) {
	return t.encode ? (await n.safe64()).encode(typeof e == "string" ? i.from(e, "utf8") : e) : typeof e == "string" ? e : i.from(e).toString("utf8");
}
async function _(e, t) {
	return t.encode ? (await n.safe64()).decode(e) : e;
}
function v(e) {
	let t = d(e, "algorithm");
	if (!Object.prototype.hasOwnProperty.call(a, t)) throw Error(`No such algorithm ${t}`);
	return {
		id: t,
		loadConfig: a[t]
	};
}
function y(e, t, n) {
	return `${e}.${t}.${n}`;
}
function b(e) {
	if (typeof e != "string" || !e.trim()) throw Error("Expected token to be a non-empty string");
	let t = e.trim(), n = t.indexOf("."), r = t.indexOf(".", n + 1);
	return n <= 0 || r <= n + 1 ? null : {
		version: t.slice(0, n),
		codecId: t.slice(n + 1, r),
		payload: t.slice(r + 1)
	};
}
function x(e) {
	if (e == null) return Infinity;
	if (typeof e != "number" || !Number.isFinite(e) || e <= 0) throw Error("Expected maxLength to be a positive finite number");
	return Math.floor(e);
}
function S({ rawText: e, transformedText: t, tokenLength: n, codecId: r, token: i }) {
	let a = encodeURIComponent(e).length, o = encodeURIComponent(t).length;
	return {
		codec: r,
		token: i,
		raw: e.length,
		rawencoded: a,
		transformed: t.length,
		transformedencoded: o,
		compressedencoded: n,
		compression: l(a / n)
	};
}
function C(e, t) {
	if (typeof e == "string") {
		let t = T(e);
		return {
			id: t.id,
			client: t
		};
	}
	if (!u(e)) throw Error(`Codec at index ${t} must be a string or codec object`);
	let n = d(String(e.id), `codec at index ${t}`);
	if (typeof e.compress != "function" || typeof e.decompress != "function") throw Error(`Codec "${n}" must provide compress and decompress`);
	return {
		id: n,
		client: e
	};
}
function w(e) {
	return !!e && typeof e == "object" && e.code === "ERR_UNSUPPORTED_CODEC";
}
function T(t, n = {}) {
	let r = f(n.transforms), i = r.map((e) => e.id), { id: a, loadConfig: o } = v(t), s = null;
	function c() {
		return s ?? (s = o()), s;
	}
	async function l(e) {
		let t = await p(e, r, "encode");
		return {
			transformed: t,
			transformedText: JSON.stringify(t)
		};
	}
	async function u(e) {
		let { transformed: t } = await l(e), n = await c(), r = await m(t, n);
		return g(await n.compress(r), n);
	}
	async function d(t, n = {}) {
		let i = e(t, n), a = await c(), o = await _(i, a);
		return await p(await h(await a.decompress(o), a), r, "decode");
	}
	async function y(e, t, n = {}) {
		try {
			return await d(e, n);
		} catch {
			return t;
		}
	}
	async function b(e) {
		let t = JSON.stringify(e), { transformedText: n } = await l(e), r = await u(e);
		return {
			...S({
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
		compress: u,
		decompress: d,
		tryDecompress: y,
		stats: b,
		transforms: i
	};
}
function E(t = {}) {
	let n = f(t.transforms), i = n.map((e) => e.id), a = (Array.isArray(t.codecs) && t.codecs.length > 0 ? t.codecs : o).map((e, t) => C(e, t)), s = /* @__PURE__ */ new Map(), c = x(t.maxLength), u = t.version === void 0 ? "1" : d(String(t.version), "version"), m = t.skipUnsupportedCodecs === !0, h = typeof t.alwaysPrefix == "boolean" ? t.alwaysPrefix : a.length !== 1, g = t.defaultCodec === void 0 ? a[0]?.id : d(t.defaultCodec, "default codec");
	if (a.forEach((e) => {
		if (s.has(e.id)) throw Error(`Duplicate codec id "${e.id}"`);
		s.set(e.id, e);
	}), !g || !s.has(g)) throw Error(`Unknown default codec "${g}"`);
	async function _(e) {
		let t = await p(e, n, "encode");
		return {
			rawText: JSON.stringify(e),
			transformed: t,
			transformedText: JSON.stringify(t)
		};
	}
	async function v(e) {
		let { rawText: t, transformed: n, transformedText: i } = await _(e), o = encodeURIComponent(t).length, s = encodeURIComponent(i).length, d = [], f = [];
		for (let e of a) try {
			let r = await e.client.compress(n);
			if (typeof r != "string") throw Error(`Codec "${e.id}" returned a non-string token`);
			let a = h ? y(u, e.id, r) : r;
			d.push({
				codec: e.id,
				token: a,
				tokenLength: a.length,
				payloadLength: r.length,
				raw: t.length,
				rawencoded: o,
				transformed: i.length,
				transformedencoded: s,
				compression: l(o / a.length)
			});
		} catch (t) {
			if (!m || !w(t)) throw t;
			f.push({
				codec: e.id,
				reason: t.message
			});
		}
		if (d.length === 0) throw f.length > 0 ? r("engine", `None of the configured codecs are supported in this environment: ${f.map((e) => e.codec).join(", ")}`) : Error("No codec candidates were produced");
		d.sort((e, t) => e.tokenLength - t.tokenLength);
		let p = d[0];
		if (p.tokenLength > c) throw Error(`Encoded token exceeds maxLength (${p.tokenLength} > ${c})`);
		return {
			codec: p.codec,
			token: p.token,
			raw: t.length,
			rawencoded: o,
			transformed: i.length,
			transformedencoded: s,
			compressedencoded: p.tokenLength,
			compression: p.compression,
			candidates: d,
			skipped: f
		};
	}
	async function S(e) {
		return (await v(e)).token;
	}
	async function T(t, r = {}) {
		let i = e(t, r), o = b(i);
		if (o && o.version === u && s.has(o.codecId)) return await p(await s.get(o.codecId).client.decompress(o.payload), n, "decode");
		if (o && (h || a.length > 1)) throw o.version === u ? Error(`Unsupported codec ${o.codecId}`) : Error(`Unsupported token version ${o.version}`);
		if (h || a.length > 1) throw Error("Encoded token is missing a version/codec prefix");
		return await p(await s.get(g).client.decompress(i), n, "decode");
	}
	async function E(e, t, n = {}) {
		try {
			return await T(e, n);
		} catch {
			return t;
		}
	}
	async function D(e) {
		return v(e);
	}
	return {
		version: u,
		codecs: a.map((e) => e.id),
		transforms: i,
		skipUnsupportedCodecs: m,
		compress: S,
		compressBest: v,
		compressDetailed: v,
		decompress: T,
		tryDecompress: E,
		tryDecodeToken: E,
		stats: D
	};
}
function D(e = {}) {
	return E({
		...e,
		version: e.version === void 0 ? "1" : e.version,
		alwaysPrefix: e.alwaysPrefix === void 0 ? !0 : e.alwaysPrefix,
		maxLength: e.maxLength === void 0 ? c : e.maxLength,
		skipUnsupportedCodecs: e.skipUnsupportedCodecs === void 0 ? !0 : e.skipUnsupportedCodecs,
		codecs: Array.isArray(e.codecs) && e.codecs.length > 0 ? e.codecs : Array.from(s)
	});
}
//#endregion
//#region src/main/index.ts
var O = Object.assign(function(e, t = {}) {
	return T(e, t);
}, {
	availableCodecs: o,
	cleanEncodedInput: t,
	defaultWebShareCodecs: s,
	defaultWebShareMaxLength: c,
	defaultWebShareVersion: "1",
	createEngine: E,
	createNamedCodec: T,
	createWebShareEngine: D
});
//#endregion
export { O as default };

//# sourceMappingURL=index.js.map