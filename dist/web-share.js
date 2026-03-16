import { n as e } from "./decode-utils-BMvRxlTb.js";
import { i as t } from "./stream-codec-D4-Gns2a.js";
import { t as n } from "./br-BYKIWxqK.js";
import { t as r } from "./df-BmqYyyJq.js";
import { t as i } from "./gz-DTcVIu1M.js";
import "./load-lzstring-24cQWH2f.js";
import { t as a } from "./lz-BjJzlp3o.js";
import { t as o } from "./raw-aEoG8x84.js";
import { Buffer as s } from "buffer";
//#region src/main/web-share.ts
var c = {
	raw: o,
	gz: i,
	df: r,
	br: n,
	lz: a
}, l = Object.freeze([
	"raw",
	"gz",
	"df",
	"br",
	"lz"
]), u = "1", d = 12e3;
function f(e) {
	return Math.floor(e * 1e4) / 1e4;
}
function p(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function m(e, t = "codec") {
	if (typeof e != "string" || !e.trim()) throw Error(`Expected ${t} to have a non-empty string id`);
	let n = e.trim();
	if (n.includes(".")) throw Error(`Expected ${t} id to not contain "."`);
	return n;
}
function h(e = []) {
	if (!e) return [];
	if (!Array.isArray(e)) throw Error("Expected transforms to be an array");
	return e.map((e, t) => {
		if (!p(e)) throw Error(`Transform at index ${t} must be an object`);
		let n = e;
		if (typeof n.encode != "function" && typeof n.decode != "function") throw Error(`Transform at index ${t} must provide encode or decode`);
		return {
			id: typeof n.id == "string" && n.id.trim() ? n.id.trim() : `transform_${t + 1}`,
			encode: n.encode,
			decode: n.decode
		};
	});
}
async function g(e, t, n) {
	let r = n === "encode" ? t : [...t].reverse(), i = e;
	for (let e of r) {
		let t = n === "encode" ? e.encode : e.decode;
		typeof t == "function" && (i = await t(i));
	}
	return i;
}
async function _(e, n) {
	return n.pack ? (await t.msgpack()).encode(e) : JSON.stringify(e);
}
async function v(e, n) {
	return n.pack ? (await t.msgpack()).decode(s.from(e)) : JSON.parse(String(e));
}
async function y(e, n) {
	return n.encode ? (await t.safe64()).encode(typeof e == "string" ? s.from(e, "utf8") : e) : typeof e == "string" ? e : s.from(e).toString("utf8");
}
async function b(e, n) {
	return n.encode ? (await t.safe64()).decode(e) : e;
}
function x(e, t, n) {
	return `${e}.${t}.${n}`;
}
function S(e) {
	if (typeof e != "string" || !e.trim()) throw Error("Expected token to be a non-empty string");
	let t = e.trim(), n = t.indexOf("."), r = t.indexOf(".", n + 1);
	return n <= 0 || r <= n + 1 ? null : {
		version: t.slice(0, n),
		codecId: t.slice(n + 1, r),
		payload: t.slice(r + 1)
	};
}
function C(e) {
	if (e == null) return Infinity;
	if (typeof e != "number" || !Number.isFinite(e) || e <= 0) throw Error("Expected maxLength to be a positive finite number");
	return Math.floor(e);
}
function w(e, t) {
	return {
		id: e,
		async compress(e) {
			let n = await _(e, t);
			return y(await t.compress(n), t);
		},
		async decompress(e) {
			let n = await b(e, t);
			return v(await t.decompress(n), t);
		}
	};
}
function T(e, t) {
	if (typeof e == "string") {
		let n = m(e, `codec at index ${t}`), r = c[n];
		if (!r) throw Error(`Unknown web share codec "${n}"`);
		return {
			id: n,
			client: w(n, r)
		};
	}
	if (!p(e)) throw Error(`Codec at index ${t} must be a string or codec object`);
	let n = m(String(e.id), `codec at index ${t}`);
	if (typeof e.compress != "function" || typeof e.decompress != "function") throw Error(`Codec "${n}" must provide compress and decompress`);
	return {
		id: n,
		client: e
	};
}
function E(e) {
	return !!e && typeof e == "object" && e.code === "ERR_UNSUPPORTED_CODEC";
}
function D({ rawText: e, transformedText: t, tokenLength: n, codecId: r, token: i }) {
	let a = encodeURIComponent(e).length, o = encodeURIComponent(t).length;
	return {
		codec: r,
		token: i,
		raw: e.length,
		rawencoded: a,
		transformed: t.length,
		transformedencoded: o,
		compressedencoded: n,
		compression: f(a / n)
	};
}
function O(t = {}) {
	let n = h(t.transforms), r = n.map((e) => e.id), i = (Array.isArray(t.codecs) && t.codecs.length > 0 ? t.codecs : Array.from(l)).map((e, t) => T(e, t)), a = /* @__PURE__ */ new Map(), o = C(t.maxLength === void 0 ? d : t.maxLength), s = t.version === void 0 ? u : m(String(t.version), "version"), c = t.skipUnsupportedCodecs === void 0 ? !0 : t.skipUnsupportedCodecs === !0, p = t.alwaysPrefix === void 0 ? !0 : t.alwaysPrefix, _ = t.defaultCodec === void 0 ? i[0]?.id : m(t.defaultCodec, "default codec");
	if (i.forEach((e) => {
		if (a.has(e.id)) throw Error(`Duplicate codec id "${e.id}"`);
		a.set(e.id, e);
	}), !_ || !a.has(_)) throw Error(`Unknown default codec "${_}"`);
	async function v(e) {
		let t = await g(e, n, "encode");
		return {
			rawText: JSON.stringify(e),
			transformed: t,
			transformedText: JSON.stringify(t)
		};
	}
	async function y(e) {
		let { rawText: t, transformed: n, transformedText: r } = await v(e), a = encodeURIComponent(t).length, l = encodeURIComponent(r).length, u = [], d = [];
		for (let e of i) try {
			let i = await e.client.compress(n);
			if (typeof i != "string") throw Error(`Codec "${e.id}" returned a non-string token`);
			let o = p ? x(s, e.id, i) : i;
			u.push({
				codec: e.id,
				token: o,
				tokenLength: o.length,
				payloadLength: i.length,
				raw: t.length,
				rawencoded: a,
				transformed: r.length,
				transformedencoded: l,
				compression: f(a / o.length)
			});
		} catch (t) {
			if (!c || !E(t)) throw t;
			d.push({
				codec: e.id,
				reason: t.message
			});
		}
		if (u.length === 0) throw Error("No codec candidates were produced");
		u.sort((e, t) => e.tokenLength - t.tokenLength);
		let m = u[0];
		if (m.tokenLength > o) throw Error(`Encoded token exceeds maxLength (${m.tokenLength} > ${o})`);
		return {
			...D({
				rawText: t,
				transformedText: r,
				tokenLength: m.tokenLength,
				codecId: m.codec,
				token: m.token
			}),
			candidates: u,
			skipped: d
		};
	}
	async function b(e) {
		return (await y(e)).token;
	}
	async function w(t, r = {}) {
		let o = e(t, r), c = S(o);
		if (c && c.version === s && a.has(c.codecId)) return await g(await a.get(c.codecId).client.decompress(c.payload), n, "decode");
		if (c && (p || i.length > 1)) throw c.version === s ? Error(`Unsupported codec ${c.codecId}`) : Error(`Unsupported token version ${c.version}`);
		if (p || i.length > 1) throw Error("Encoded token is missing a version/codec prefix");
		return await g(await a.get(_).client.decompress(o), n, "decode");
	}
	async function O(e, t, n = {}) {
		try {
			return await w(e, n);
		} catch {
			return t;
		}
	}
	return {
		version: s,
		codecs: i.map((e) => e.id),
		transforms: r,
		skipUnsupportedCodecs: c,
		compress: b,
		compressBest: y,
		compressDetailed: y,
		decompress: w,
		tryDecompress: O,
		tryDecodeToken: O,
		stats: y
	};
}
//#endregion
export { O as default };

//# sourceMappingURL=web-share.js.map