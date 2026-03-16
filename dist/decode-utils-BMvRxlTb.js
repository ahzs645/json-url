//#region src/main/decode-utils.ts
function e(e) {
	let t = "", n = 0, r = 0, i;
	for (; n < e.length;) i = e.charCodeAt(n), i === 37 ? (n > r && (t += e.slice(r, n)), e = decodeURIComponent(e.slice(n)), n = 0, r = 0) : i === 32 || i === 10 || i === 13 || i === 0 || i === 8232 || i === 8233 ? (n > r && (t += e.slice(r, n)), n += 1, r = n) : n += 1;
	return n > r && (t += e.slice(r, n)), t;
}
function t(e = {}) {
	if (!e || typeof e != "object" || Array.isArray(e)) throw Error("Expected decode options to be an object");
	return { deURI: e.deURI === !0 };
}
function n(n, r = {}) {
	if (typeof n != "string") throw Error("Expected encoded input to be a string");
	let { deURI: i } = t(r);
	return i ? e(n) : n;
}
//#endregion
export { n, e as t };

//# sourceMappingURL=decode-utils-BMvRxlTb.js.map