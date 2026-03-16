import { t as e } from "./rolldown-runtime-CAFD8bLK.js";
import { t } from "./load-lzstring-Bp-ev5a0.js";
//#region src/main/codecs/lz.ts
var n = /* @__PURE__ */ e({ default: () => r }), r = {
	pack: !1,
	encode: !1,
	async compress(e) {
		return (await t()).compressToEncodedURIComponent(String(e));
	},
	async decompress(e) {
		let n = (await t()).decompressFromEncodedURIComponent(String(e));
		if (n === null) throw Error("Unable to decode lz codec payload");
		return n;
	}
};
//#endregion
export { n, r as t };

//# sourceMappingURL=lz-YJ-6p0Xx.js.map