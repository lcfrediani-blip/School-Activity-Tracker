---
name: Clerk proxy in Expo production
description: Production Expo bundles must target the API's Clerk proxy, while the development app uses direct Clerk requests.
---

Production Expo builds must pass `https://<app-domain>/api/__clerk` as Clerk's `proxyUrl`; the API serves that endpoint only in production. Do not rely on `CLERK_PROXY_URL` being present in the workspace environment.

**Why:** The workspace had no configured `CLERK_PROXY_URL`, which left the production proxy middleware unused by the mobile bundle even though the server route existed.

**How to apply:** Keep the build-time proxy path aligned with the API route. Leave the Expo development command on direct Clerk requests unless the development API proxy is enabled too.