import type { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export const CLERK_PROXY_PATH = "/api/__clerk";

export function getClerkProxyHost(req: { headers: Record<string, string | string[] | undefined> }): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const host = value?.split(",")[0]?.trim() || req.headers.host;
  return Array.isArray(host) ? host[0] : host;
}

export function clerkProxyMiddleware(): RequestHandler {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (process.env.NODE_ENV !== "production" || !secretKey) {
    return (_req, _res, next) => next();
  }
  return createProxyMiddleware({
    target: "https://frontend-api.clerk.dev",
    changeOrigin: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const host = getClerkProxyHost(req);
        proxyReq.setHeader("Clerk-Proxy-Url", `https://${host}${CLERK_PROXY_PATH}`);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);
      },
    },
  });
}