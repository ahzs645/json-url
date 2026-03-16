import { t as e } from "./rolldown-runtime-CAFD8bLK.js";
import { r as t, t as n } from "./stream-codec-Bx0Tud9V.js";
//#region src/main/codecs/zl.ts
var r = /* @__PURE__ */ e({ default: () => i }), i = {
	pack: !1,
	encode: !0,
	async compress(e) {
		return n(String(e), "deflate", "zl");
	},
	async decompress(e) {
		return t(typeof e == "string" ? new TextEncoder().encode(e) : e, "deflate", "zl");
	}
};
//#endregion
export { r as n, i as t };

//# sourceMappingURL=zl-C5BQpHjN.js.map