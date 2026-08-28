import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages accessibles sans connexion ET qui redirigent vers / si déjà connecté
const AUTH_PAGES = ["/login", "/register"];
// Pages toujours accessibles quel que soit le statut de connexion
const ALWAYS_PUBLIC = ["/consent"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isAlwaysPublic = ALWAYS_PUBLIC.some((p) => pathname.startsWith(p));

  if (!token && !isAuthPage && !isAlwaysPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
