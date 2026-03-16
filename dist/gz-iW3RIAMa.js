import { t as e } from "./rolldown-runtime-CAFD8bLK.js";
import { r as t, t as n } from "./stream-codec-Bx0Tud9V.js";
//#region src/main/codecs/gz.ts
var r = /* @__PURE__ */ e({ default: () => i }), i = {
	pack: !1,
	encode: !0,
	async compress(e) {
		return n(String(e), "gzip", "gz");
	},
	async decompress(e) {
		return t(typeof e == "string" ? new TextEncoder().encode(e) : e, "gzip", "gz");
	}
};
//#endregion
export { r as n, i as t };

//# sourceMappingURL=gz-iW3RIAMa.js.map