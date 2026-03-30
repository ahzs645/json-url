# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 4.x     | Yes                |
| < 4.0   | No                 |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public issue.** Instead, email the maintainers directly or use GitHub's private vulnerability reporting feature.

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

This library processes arbitrary JSON for URL compression. Security considerations include:

- **Input validation**: The library deserializes compressed tokens back into JSON. Malformed or adversarial tokens should not cause crashes or code execution.
- **Denial of service**: Extremely large or deeply nested payloads may consume significant memory during compression/decompression.
- **Browser CSP**: The library avoids `eval()` and `new Function()` to remain compatible with strict Content Security Policies.
