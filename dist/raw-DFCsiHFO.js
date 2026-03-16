import { t as e } from "./rolldown-runtime-CAFD8bLK.js";
import { Buffer as t } from "buffer";
//#region src/main/codecs/raw.ts
var n = /* @__PURE__ */ e({ default: () => r }), r = {
	pack: !1,
	encode: !0,
	async compress(e) {
		return t.from(typeof e == "string" ? e : t.from(e).toString("utf8"), "utf8");
	},
	async decompress(e) {
		return t.from(typeof e == "string" ? t.from(e, "utf8") : e).toString("utf8");
	}
};
//#endregion
export { n, r as t };

//# sourceMappingURL=raw-DFCsiHFO.js.map