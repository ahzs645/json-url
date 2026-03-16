import { t as e } from "./rolldown-runtime-CAFD8bLK.js";
import { r as t, t as n } from "./stream-codec-BflxNGHP.js";
//#region src/main/codecs/df.ts
var r = /* @__PURE__ */ e({ default: () => i }), i = {
	pack: !1,
	encode: !0,
	async compress(e) {
		return n(String(e), "deflate-raw", "df");
	},
	async decompress(e) {
		return t(typeof e == "string" ? new TextEncoder().encode(e) : e, "deflate-raw", "df");
	}
};
//#endregion
export { r as n, i as t };

//# sourceMappingURL=df-BND5OOZQ.js.map