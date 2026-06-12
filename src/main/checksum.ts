export const CHECKSUM_LENGTH = 7;

const CHECKSUM_PATTERN = /^[0-9a-z]{7}$/;

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
	if (crcTable) return crcTable;

	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c;
	}
	crcTable = table;
	return table;
}

function crc32(input: string): number {
	const bytes = new TextEncoder().encode(input);
	const table = getCrcTable();
	let crc = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) {
		crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

export function computeChecksum(input: string): string {
	return crc32(input).toString(36).padStart(CHECKSUM_LENGTH, '0');
}

export function isChecksumSegment(segment: string): boolean {
	return CHECKSUM_PATTERN.test(segment);
}

export function appendChecksum(token: string): string {
	return `${token}.${computeChecksum(token)}`;
}

export interface StrippedChecksumToken {
	token: string;
	valid: boolean;
}

export function stripChecksum(token: string): StrippedChecksumToken | null {
	const lastDot = token.lastIndexOf('.');
	if (lastDot <= 0) return null;

	const segment = token.slice(lastDot + 1);
	if (!isChecksumSegment(segment)) return null;

	const body = token.slice(0, lastDot);
	return {
		token: body,
		valid: computeChecksum(body) === segment
	};
}
