# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Please report security issues **privately**. Do not open a public issue, pull request or discussion.

Use GitHub's private reporting flow: go to the repository's **Security** tab and choose **Report a vulnerability**. This opens a private advisory visible only to the maintainers.

Include as much of the following as possible:

- A description of the issue and its impact
- Steps to reproduce, with a proof of concept if available
- Affected version, browser and deployment mode (mock enabled or real API)
- Any suggested fix or mitigation

You can expect an initial acknowledgement within a few days. We will investigate, keep you informed, and credit you in the advisory if you wish.

## Scope

### In scope

- Cross-site scripting or injection bugs in the template
- Open redirects, token leaks or flaws in the refresh/logout flow
- Service worker or caching behavior that could serve malicious or stale content
- Dependency vulnerabilities that affect the shipped application
- Build or deployment configuration that exposes secrets

### Out of scope

- **The client-side permission model.** RBAC in this project is a UI demonstration. Anyone can bypass it with browser devtools. Reports that "a viewer can call the API directly" are expected behavior unless the mock or a real backend fails to enforce authorization.
- **Demo credentials and mock tokens.** `admin@fish.dev / Admin123!` and the fake JWTs are public by design and exist only in the browser mock.
- Missing hardening headers on a deployment that does not use the bundled nginx configuration, unless they cause a concrete exploit.
- Reports from automated scanners without a demonstrated impact.

If you connect FishAdmin to a real backend, server-side authorization and session management become your responsibility. The template's documentation explains the expected contract; it cannot enforce it.

## Safe harbor

We will not pursue legal action for research that stays within this scope, avoids privacy violations and data destruction, and gives us reasonable time to fix the issue before public disclosure. Please do not test against deployments you do not own.
