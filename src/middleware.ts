import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("exo_zilton_admin");
    if (!session?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
    const session = request.cookies.get("exo_zilton_admin");
    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
