import { describe, expect, it } from 'vitest';

import { decode, encode, validate } from '../src/main/safe64.js';

describe('safe64', () => {
	it('round-trips text through base64url', () => {
		for (const value of ['', 'a', 'hello', '{"l":"horizontal"}', 'ünïcødé ✓', 'x'.repeat(1000)]) {
			expect(new TextDecoder().decode(decode(encode(value)))).toBe(value);
		}
	});

	it('emits no characters that need escaping in a URL', () => {
		// Every byte value, so every base64 alphabet position is exercised — including the two
		// that differ from standard base64.
		const all = encode(new Uint8Array(Array.from({ length: 256 }, (_, i) => i)));

		expect(all).toMatch(/^[A-Za-z0-9\-_]+$/);
		expect(all).not.toContain('+');
		expect(all).not.toContain('/');
		expect(all).not.toContain('=');
	});

	it('decodes without padding', () => {
		// Lengths 1, 2 and 3 cover all three padding cases.
		for (const value of ['a', 'ab', 'abc']) {
			const encoded = encode(value);
			expect(encoded).not.toContain('=');
			expect(new TextDecoder().decode(decode(encoded))).toBe(value);
		}
	});

	it('validates the alphabet it produces', () => {
		expect(validate(encode('anything at all'))).toBe(true);
		expect(validate('not+base64url')).toBe(false);
		expect(validate('padded=')).toBe(false);
	});

	it('decodes without touching a global Buffer', () => {
		// The reason this module exists: urlsafe-base64's decode constructed a buffer through the
		// global, which does not exist in a browser, so decoding threw there while encoding worked.
		// TextDecoder is used for the assertion so the check itself does not depend on the global
		// it has just removed.
		const globals = globalThis as { Buffer?: unknown };
		const saved = globals.Buffer;
		const encoded = encode('browser safe');
		delete globals.Buffer;

		try {
			expect(new TextDecoder().decode(decode(encoded))).toBe('browser safe');
		} finally {
			if (saved !== undefined) globals.Buffer = saved;
		}
	});
});
