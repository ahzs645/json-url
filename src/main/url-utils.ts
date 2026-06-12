import type { UrlShareLocation, UrlShareOptions } from './types.js';

export const DEFAULT_URL_PARAM = 'data';

function normalizeParam(param?: string): string {
	if (typeof param === 'undefined') {
		return DEFAULT_URL_PARAM;
	}

	if (typeof param !== 'string' || !param.trim()) {
		throw new Error('Expected param to be a non-empty string');
	}

	return param.trim();
}

function normalizeLocation(location?: UrlShareLocation): UrlShareLocation | undefined {
	if (typeof location === 'undefined') {
		return undefined;
	}

	if (location !== 'query' && location !== 'hash') {
		throw new Error('Expected location to be "query" or "hash"');
	}

	return location;
}

function parseUrl(input: string, label: string): URL {
	if (typeof input !== 'string' || !input.trim()) {
		throw new Error(`Expected ${label} to be a non-empty string`);
	}

	try {
		return new URL(input);
	} catch {
		throw new Error(`Expected ${label} to be a valid absolute URL`);
	}
}

function readHashParams(url: URL): URLSearchParams {
	const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
	return new URLSearchParams(hash);
}

export function buildShareUrl(
	baseUrl: string,
	token: string,
	options: UrlShareOptions = {}
): string {
	if (typeof token !== 'string' || !token) {
		throw new Error('Expected token to be a non-empty string');
	}

	const param = normalizeParam(options.param);
	const location = normalizeLocation(options.location) ?? 'query';
	const url = parseUrl(baseUrl, 'baseUrl');

	if (location === 'query') {
		url.searchParams.set(param, token);
	} else {
		const hashParams = readHashParams(url);
		hashParams.set(param, token);
		url.hash = hashParams.toString();
	}

	return url.toString();
}

export function extractTokenFromUrl(
	url: string,
	options: UrlShareOptions = {}
): string | null {
	const param = normalizeParam(options.param);
	const location = normalizeLocation(options.location);
	const parsed = parseUrl(url, 'url');
	const locations: UrlShareLocation[] = location ? [location] : ['query', 'hash'];

	for (const candidate of locations) {
		const params = candidate === 'query' ? parsed.searchParams : readHashParams(parsed);
		const value = params.get(param);
		if (value !== null && value !== '') {
			return value;
		}
	}

	return null;
}
