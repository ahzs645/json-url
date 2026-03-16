import { t as e } from "./rolldown-runtime-CAFD8bLK.js";
import { r as t, t as n } from "./stream-codec-D4-Gns2a.js";
//#region src/main/codecs/br.ts
var r = /* @__PURE__ */ e({ default: () => i }), i = {
	pack: !1,
	encode: !0,
	async compress(e) {
		return n(String(e), "brotli", "br");
	},
	async decompress(e) {
		return t(typeof e == "string" ? new TextEncoder().encode(e) : e, "brotli", "br");
	}
};
//#endregion
export { r as n, i as t };

//# sourceMappingURL=br-BYKIWxqK.js.map