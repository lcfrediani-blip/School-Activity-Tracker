---
name: Clerk proxy in Expo production
description: Production Expo bundles must target the API's Clerk proxy, while the development app uses direct Clerk requests.
---

Production Expo builds must forward the managed `CLERK_PROXY_URL` as `EXPO_PUBLIC_CLERK_PROXY_URL`; the dev value is intentionally empty, so the app connects directly to Clerk during development. Do not hardcode a proxy fallback or edit the managed variable.

**Why:** Replit manages this proxy variable as part of Clerk setup and publication. It may not appear when inspecting ordinary environment variables, and an empty dev value is expected.

**How to apply:** Preserve the build script's forwarding from `CLERK_PROXY_URL` to `EXPO_PUBLIC_CLERK_PROXY_URL` and pass the latter to `ClerkProvider` unconditionally; the managed value selects direct dev FAPI or the production proxy.