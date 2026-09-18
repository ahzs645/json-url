import { Buffer } from 'buffer';

/**
 * URL-safe base64 (RFC 4648 §5): `+` becomes `-`, `/` becomes `_`, and padding is dropped.
 *
 * This replaces the `urlsafe-base64` package, which cannot be used in a browser. Its `decode`
 * constructs a buffer through the *global* `Buffer`, and there is no such global outside Node — so
 * a token would encode happily (encode only calls a method on a buffer handed to it, which is the
 * polyfilled one) and then throw `Buffer is not defined` on the way back. That asymmetry made the
 * failure specific to decoding, and therefore specific to whoever opened a link rather than
 * whoever created it.
 *
 * Importing `Buffer` from the `buffer` package, as the rest of this library already does, resolves
 * to Node's implementation under Node and to the polyfill in a bundle. Same semantics either way.
 */

export function encode(input: Uint8Array | string): string {
	const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input);

	return buffer
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

export function decode(input: string): Uint8Array {
	// Padding is not restored: Buffer's base64 decoder does not require it.
	return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function validate(input: string): boolean {
	return /^[A-Za-z0-9\-_]+$/.test(input);
}

const safe64 = { encode, decode, validate };

export default safe64;
