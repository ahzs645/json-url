import { Buffer as e } from "buffer";
//#region src/main/load-lzw.ts
function t(e) {
	return e.default || e;
}
async function n() {
	return t(await import("node-lzw"));
}
//#endregion
//#region src/main/codecs/lzw.ts
var r = {
	pack: !0,
	encode: !0,
	async compress(t) {
		let r = e.from(t);
		return e.from((await n()).encode(r.toString("binary")));
	},
	async decompress(t) {
		return e.from((await n()).decode(e.from(t)), "binary");
	}
};
//#endregion
export { r as default };

//# sourceMappingURL=lzw-BhWZrokT.js.map