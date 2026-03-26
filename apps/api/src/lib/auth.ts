import type { FastifyRequest } from "fastify";

const publicRoutes = new Set([
  "/health",
  "/api/v1/chatgpt/openapi.json",
  "/api/v1/chatgpt/instructions",
  "/api/v1/chatgpt/instructions.txt"
]);

function getRequestPath(request: FastifyRequest): string {
  return request.url.split("?")[0] ?? request.url;
}

export function shouldRequireApiAuth(request: FastifyRequest): boolean {
  const path = getRequestPath(request);
  if (publicRoutes.has(path)) {
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
