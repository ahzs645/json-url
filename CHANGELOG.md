# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- URL helpers on codecs and engines: `compressToUrl()`, `decompressFromUrl()` and
  `tryDecompressFromUrl()` write/read share tokens directly to a query parameter
  (default `data`) or hash fragment of a URL
- Standalone `buildShareUrl()` / `extractTokenFromUrl()` utility exports
- `createKeyMapTransform()` for reversible key shortening (e.g. `builderName` → `bn`)
  applied recursively before compression and restored after decompression
- `pbr` and `pdf` codecs (MessagePack packing + brotli / deflate-raw); `pbr` produces
  the shortest tokens overall on the benchmark samples and `pdf` excels on tiny payloads
- `checksum: true` engine option appends a CRC32 segment to tokens
  (`version.codec.payload.checksum`) so truncated or corrupted tokens fail with a
  clear error on decode
- `maxUrlLength` option on `compressToUrl()` / `buildShareUrl()` to reject URLs that
  exceed a length budget
- `createNumberPrecisionTransform()` for lossy rounding of float noise before encoding
- `createDefaultsTransform()` for declarative, reversible default stripping: keys whose
  value is deep-equal to a configured default are removed on encode and restored on
  decode. Rules target the top-level value (no `match`) or any record node via a
  `match` predicate; supports function-valued defaults and doubles as an empty-container
  pruner (use `{}` / `[]` defaults)
- `createResolverReferenceTransform()` for dynamic library references: compacts an
  embedded node to a compact reference on encode (`match` / `toRef`) and rehydrates it
  from a caller-supplied, possibly async resolver on decode (`fromRef`) — e.g. browser
  library storage or a seed catalogue, complementing the fixed-dictionary
  `createReferenceTransform()`
- `createDefaultsTransform()` gained `into` (descend a dot-separated key path before
  applying defaults; the sub-object is recreated on decode), `pruneEmptyInto` (drop an
  emptied sub-object on encode), and `dropWhen` (drop a whole sub-object on encode and
  restore it in full on decode) — enough to express nested/conditional config defaults

### Fixed
- Homogeneous-array codecs (`hgz`/`hbr`) no longer throw "Invalid packed homogeneous
  array header" when sibling arrays share a schema path but only some were packed.
  Packed arrays now carry a self-identifying sentinel so decode unpacks only the arrays
  that were actually packed and leaves raw siblings untouched.

## [4.1.0] - 2024-12-01

### Added
- `createWebShareEngine()` preset for Webforms-style transport defaults
- `tryDecompress` / `tryDecodeToken` fallback APIs
- `deURI` option to clean percent-encoded or whitespace-polluted tokens
- Stream-based codecs: `gz`, `df`, `zl`, `br`, `lz`
- `cleanEncodedInput()` utility export
- TypeScript strict mode and full type declarations

### Changed
- Migrated build from Babel/Rollup to Vite
- Migrated tests from Mocha/NYC to Vitest
- Migrated linting to ESLint 9 flat config with typescript-eslint
- Package renamed to `@firstform/json-url`
- Dual ESM/CJS output with conditional exports

## [3.1.0] - 2021-01-01

### Added
- Multi-codec engine with `createEngine()`
- Object-level transforms (encode/decode pipelines)
- Versioned token format (`version.codec.payload`)
- `compressDetailed()` for inspecting codec candidates

## [2.2.0] - 2018-06-01

### Added
- `lzstring` codec support
- `stats()` API for compression ratio reporting

## [1.0.0] - 2015-12-01

### Added
- Initial release
- `compress` / `decompress` API
- `lzw`, `lzma`, `pack` codecs
- URL-safe base64 encoding
- Browser UMD bundle
