import type { FastifyRequest } from "fastify";

const publicRoutes = new Set([
  "/health",
  "/mobile",
  "/mobile/",
  "/mobile/manifest.webmanifest",
  "/api/v1/chatgpt/openapi.json",
  "/api/v1/chatgpt/instructions",
  "/api/v1/chatgpt/instructions.txt"
]);

function isPublicReadOnlyApiRoute(request: FastifyRequest, path: string): boolean {
  if (request.method === "GET") {
    return (
      path === "/api/v1/inventory/items" ||
      path === "/api/v1/inventory/drink-now" ||
      /^\/api\/v1\/inventory\/items\/[^/]+$/.test(path) ||
      /^\/api\/v1\/inventory\/items\/[^/]+\/events$/.test(path)
    );
  }

  if (request.method === "POST") {
    return (
      path === "/api/v1/recommendations/wine" ||
      path === "/api/v1/recommendations/cocktails"
    );
  }

  return false;
}

function getRequestPath(request: FastifyRequest): string {
  return request.url.split("?")[0] ?? request.url;
}

export function shouldRequireApiAuth(request: FastifyRequest): boolean {
  const path = getRequestPath(request);
  if (publicRoutes.has(path)) {
    return false;
  }

  if (isPublicReadOnlyApiRoute(request, path)) {
    return false;
  }

  return path.startsWith("/api/v1/");
}

export function isAuthorizedRequest(
  request: FastifyRequest,
  expectedToken: string
): boolean {
  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader) {
    return false;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  return scheme === "Bearer" && token === expectedToken;
}
