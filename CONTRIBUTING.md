# Contributing to @firstform/json-url

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/ahzs645/json-url.git
cd json-url
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Lint, typecheck, and run tests |
| `npm run test:node` | Run tests only (no lint/typecheck) |
| `npm run coverage` | Run tests with coverage report |
| `npm run build` | Build library and browser bundle |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler checks |
| `npm run perf` | Run performance benchmarks |

## Workflow

1. Fork the repository and create a feature branch from `master`.
2. Make your changes. Add or update tests as needed.
3. Run `npm test` to ensure linting, type checking, and all tests pass.
4. Commit with a clear, descriptive message.
5. Open a pull request against `master`.

## Code Style

- TypeScript strict mode is enabled; do not use `any` unless absolutely necessary.
- Follow the existing ESLint configuration (`eslint.config.js`).
- Keep pull requests focused — one feature or fix per PR.

## Adding a New Codec

1. Create `src/main/codecs/<name>.ts` implementing the `Codec` interface.
2. Register the codec in `src/main/codecs/index.ts`.
3. Add round-trip tests in `test/index.test.ts`.
4. Update `README.md` with the new codec in the valid codecs list.

## Reporting Bugs

Open an issue with:
- A minimal reproduction case
- Expected vs actual behavior
- Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
