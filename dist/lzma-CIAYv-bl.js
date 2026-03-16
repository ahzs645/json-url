import { Buffer as e } from "buffer";
//#region src/main/load-lzma.ts
function t(e) {
	return e.default || e;
}
async function n() {
	let e = t(await import("lzma"));
	return typeof e.compress == "function" ? e : e.LZMA;
}
//#endregion
//#region src/main/codecs/lzma.ts
var r = {
	pack: !0,
	encode: !0,
	async compress(t) {
		let r = e.from(t), i = await n();
		return new Promise((t, n) => {
			i.compress(r, 9, (r, i) => {
				if (i) {
					n(i);
					return;
				}
				t(e.from(r));
			});
		});
	},
	async decompress(t) {
		let r = e.from(t), i = await n();
		return new Promise((t, n) => {
			i.decompress(r, (r, i) => {
				if (i) {
					n(i);
					return;
				}
				t(e.from(r));
			});
		});
	}
};
//#endregion
export { r as default };

//# sourceMappingURL=lzma-CIAYv-bl.js.map