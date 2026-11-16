import { NextResponse, type NextRequest } from "next/server";
import { hasValidAdminCookie } from "@/lib/admin-cookie";
import { getSessionOptions } from "@/lib/auth";

// Every admin page and API request must carry a session cookie that decrypts
// with the session secret. Checking only that the cookie exists isn't enough:
// client-side navigations can render a page without re-running the panel layout.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login") || pathname === "/api/admin/logout") {
    return NextResponse.next();
  }

  const { password, cookieName } = getSessionOptions();
  const authenticated = await hasValidAdminCookie(request.cookies.get(cookieName)?.value, password);

  if (!authenticated && pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!authenticated && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
