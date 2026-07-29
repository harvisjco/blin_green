import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: "/admin/:path*",
};

export default function proxy(request: NextRequest) {
  const user = (env as { ADMIN_USER?: string }).ADMIN_USER;
  const pass = (env as { ADMIN_PASSWORD?: string }).ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse("Admin login is not configured.", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const providedUser = decoded.slice(0, separatorIndex);
    const providedPass = decoded.slice(separatorIndex + 1);
    if (providedUser === user && providedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
  });
}
