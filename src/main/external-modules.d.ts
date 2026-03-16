declare module 'urlsafe-base64' {
	export function encode(input: Uint8Array | string): string;
	export function decode(input: string): Uint8Array;
	export function validate(input: string): boolean;

	const urlsafeBase64: {
		encode: typeof encode;
		decode: typeof decode;
		validate: typeof validate;
	};

	export default urlsafeBase64;
}

declare module 'node-lzw' {
	export function encode(input: string): Uint8Array | number[];
	export function decode(input: Uint8Array | number[]): string;

	const lzw: {
		encode: typeof encode;
		decode: typeof decode;
	};

	export default lzw;
}

declare module 'msgpack5' {
	export interface MsgPackInstance {
		encode(value: unknown): Uint8Array;
		decode(value: Uint8Array): unknown;
	}

	export default function createMsgPack(): MsgPackInstance;
}

declare module 'lzma' {
	export interface LzmaApi {
		compress(
			input: Uint8Array,
			level: number,
			callback: (result: Uint8Array | number[], error?: unknown) => void
		): void;
		decompress(
			input: Uint8Array,
			callback: (result: Uint8Array | number[], error?: unknown) => void
		): void;
	}

	export const LZMA: LzmaApi;
	const lzma: LzmaApi;
	export default lzma;
}
