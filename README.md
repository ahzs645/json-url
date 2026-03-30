# json-url

[![npm downloads][downloads-image]][downloads-url] [![CI][ci-image]][ci-url]

Generate URL-safe representations of some arbtirary JSON data in as small a space as possible that can be shared in a bookmark / link.

Although designed to work in Node, a standalone client-side library is provided that can be used directly on the browser.

## Usage

### Compress

```
	var codec = require('json-url')('lzw');
	var obj = { one: 1, two: 2, three: [1,2,3], four: 'red pineapples' };
	codec.compress(obj).then(result => console.log(result));
	/* Result: woTCo29uZQHCo3R3bwLCpXRocmVlwpMBAgPCpGZvdXLCrsSOZCBwacSDYXBwbGVz */
```

### Decompress

```
	var codec = require('json-url')('lzma');
	codec.decompress(someCompressedString).then(json => { /* operate on json */ })
```

### Try Decompress

If you want a fallback instead of an exception, use `tryDecompress`.

```
	var codec = require('json-url')('raw');
	codec.tryDecompress('%7Bbad', { ok: false }, { deURI: true }).then(result => {
		console.log(result); // { ok: false }
	});
```

### Stats

```
	var codec = require('json-url')('lzstring');
	codec.stats(obj).then(
		({ rawencoded, compressedencoded, compression }) => {
			console.log(`Raw URI-encoded JSON string length: ${rawencoded}`);
			console.log(`Compressed URI-encoded JSON string length: ${compressedencoded}`);
			console.log(`Compression ratio (raw / compressed): ${compression}`);
		}
	);
```

### Transforms

You can now pass reversible object-level transforms before compression and after decompression. This is useful when you want to compact project-specific structures into portable primitive references before the codec runs.

```
	const JsonUrl = require('json-url');
	const codec = JsonUrl('lzstring', {
		transforms: [
			{
				id: 'asset-ref',
				encode(value) {
					if (!value.asset || !value.asset.embedded) return value;
					return { ...value, asset: { ref: value.asset.id } };
				},
				decode(value) {
					if (!value.asset || !value.asset.ref) return value;
					return { ...value, asset: { id: value.asset.ref, embedded: 'resolved elsewhere' } };
				}
			}
		]
	});
```

### Multi-codec Engine

When you want to test multiple codecs and keep the shortest token, use `createEngine`. Tokens are prefixed as `version.codec.payload`, so the engine can auto-detect the codec when decoding.

```
	const JsonUrl = require('json-url');

	const engine = JsonUrl.createEngine({
		codecs: ['hbr', 'br', 'hgz', 'gz', 'lzstring'],
		transforms: [
			{
				id: 'compact-hotspot',
				encode(value) {
					if (!value.hotspot || !value.hotspot.embedded) return value;
					return {
						...value,
						hotspot: {
							mapRef: value.hotspot.id,
							overrides: value.hotspot.overrides || {}
						}
					};
				},
				decode(value) {
					if (!value.hotspot || !value.hotspot.mapRef) return value;
					return {
						...value,
						hotspot: {
							id: value.hotspot.mapRef,
							overrides: value.hotspot.overrides || {}
						}
					};
				}
			}
		],
		maxLength: 12000
	});

	const result = await engine.compressDetailed(hugeJsonObject);
	console.log(result.codec, result.token, result.candidates);

	const token = await engine.compress(hugeJsonObject);
	const original = await engine.decompress(token);
```

`decompress()` on codecs and engines accepts `{ deURI: true }`, which first removes encoded whitespace and percent-encoding. This is useful when a token has been copied through chat tools or other surfaces that re-encode it.

```
	const decoded = await engine.decompress('%201.raw.eyJvayI6dHJ1ZX0%20', { deURI: true });
	const fallback = await engine.tryDecodeToken('%7Bbad', { ok: false }, { deURI: true });
```

### Web Share Engine

`createWebShareEngine()` enables the Webforms-style transport defaults:

* token format `1.codec.payload`
* codecs `raw`, `gz`, `df`, `br`, `lz`
* `alwaysPrefix: true`
* `maxLength: 12000`
* `skipUnsupportedCodecs: true`

```
	const JsonUrl = require('json-url');
	const engine = JsonUrl.createWebShareEngine({
		transforms: [
			{
				id: 'library-ref',
				encode(value) {
					if (!value.map || !value.map.embedded) return value;
					return {
						...value,
						map: {
							mapRef: value.map.id,
							overrides: value.map.overrides || {}
						}
					};
				},
				decode(value) {
					return value;
				}
			}
		]
	});
```

### Standalone Browser Bundle

```
<script type="text/javascript" src="/dist/browser/json-url-single.js"></script>
<script>
	const lib = JsonUrl('lzma'); // JsonUrl is added to the window object
	lib.compress(parsed).then(output => { result.value = output; });
</script>
```

To see it in action, download the source code and run `npm run example`, or simply visit [this link](http://jsbin.com/cayuhox).

* The browser bundle is now generated with Vite/Rollup as a single UMD file at `dist/browser/json-url-single.js`.
* The bundle is still relatively large because it includes runtime polyfills and codec dependencies needed for standalone browser use.

## Usage Notes

* Although not all algorithms are asynchronous, all functions return Promises to ensure compatibility.
* Instantiate an instance with appropriate compression codec before using.
* Valid codecs:
	* lzw
	* lzma
	* lzstring - runs lzstring against a stringified JSON instead of using MessagePack on JSON
	* pack - this just uses MessagePack and converts the binary buffer into a Base64 URL-safe representation, without any other compression
	* raw - Base64URL encoded UTF-8 JSON bytes
	* gz - gzip via `CompressionStream` with environment fallback
	* hgz - gzip with safe homogeneous-array prepacking for repeated object rows
	* df - deflate-raw via `CompressionStream` with environment fallback
	* br - brotli via `CompressionStream` with environment fallback
	* hbr - brotli with safe homogeneous-array prepacking for repeated object rows
	* lz - `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`
* `JsonUrl.createEngine()` can test multiple codecs, apply reversible transforms, and emit self-describing `version.codec.payload` tokens.
* `JsonUrl.createWebShareEngine()` is a preset for `raw/gz/df/br/lz` with `version: "1"` and `maxLength: 12000`.
* `JsonUrl.cleanEncodedInput()` removes percent-encoding and ignorable whitespace before decode.

## Package Layout

The package now exposes:

* CommonJS via `require('json-url')`
* ESM via `import JsonUrl from 'json-url'`
* Browser UMD bundle via `json-url/browser`
* Type declarations via `dist/index.d.ts`

## Motivation

Typically when you want to shorten a long URL with large amounts of data parameters, the approach is to generate a "short URL" where compression is achieved by using a third-party service which stores the true URL and redirects the user (e.g. bit.ly or goo.gl).

However, if you want to:

* share bookmarks with virtually unlimited combinations of state and/or
* want to avoid the third-party dependency

you would encode the data structure (typically JSON) in your URL, but this often results in very large URLs.

This approach differs by removing that third-party dependency and encodes it using common compression algorithms such as LZW or LZMA.

Note: It is arguable that a custom dictionary / domain specific encoding would ultimately provide better compression, but here we want to
* avoid maintaining such a dictionary and/or
* retain cross-application compatibility (otherwise you need a shared dictionary)

## Approach

I explored several options, the most popular one being [MessagePack][1]. However, I noticed that it did not give the best possible compression as compared to [LZMA][2] and [LZW][3].

At first I tried to apply the binary compression directly on a stringified JSON, then I realised that packing it first resulted in better compression.

For small JS objects, LZW largely outperformed LZMA, but for the most part you'd probably be looking to compress large JSON data rather than small amounts (otherwise a simple stringify + base64 is sufficient). You can choose to use whatever codec suits you best.

In addition, there is now support for [LZSTRING][5], although the URI encoding still uses urlsafe-base64 because LZSTRING still uses unsafe characters via their `compressToURIEncodedString` method - notably the [`+` character][6]

Finally, I went with [urlsafe-base64][4] to encode it in a URL-friendly format.

## TODO

Find a way to improve bundle sizes for browser usage.

[1]: http://msgpack.org/index.html
[2]: https://www.npmjs.com/package/lzma
[3]: https://www.npmjs.com/package/node-lzw
[4]: https://www.npmjs.com/package/urlsafe-base64
[5]: http://pieroxy.net/blog/pages/lz-string/index.html
[6]: https://github.com/pieroxy/lz-string/blob/master/libs/lz-string.js#L15

[downloads-image]: https://img.shields.io/npm/dm/@firstform/json-url.svg?style=flat-square
[downloads-url]: https://www.npmjs.com/package/@firstform/json-url
[ci-image]: https://github.com/ahzs645/json-url/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/ahzs645/json-url/actions/workflows/ci.yml
