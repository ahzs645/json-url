import { t as e } from "./load-lzstring-24cQWH2f.js";
import { Buffer as t } from "buffer";
//#region src/main/codecs/lzstring.ts
var n = {
	pack: !1,
	encode: !0,
	async compress(n) {
		return t.from((await e()).compressToUint8Array(String(n)));
	},
	async decompress(n) {
		return (await e()).decompressFromUint8Array(typeof n == "string" ? new TextEncoder().encode(n) : t.from(n));
	}
};
//#endregion
export { n as default };

//# sourceMappingURL=lzstring-D9FpqWVz.js.map