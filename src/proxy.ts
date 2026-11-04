import { NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "platform",
]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  const hostname = host.split(":")[0].toLowerCase();

  let subdomain: string | null = null;

  // Local development: school-slug.localhost:3000
  if (hostname.endsWith(".localhost")) {
    subdomain = hostname.slice(0, -".localhost".length);
  } else {
    // Production: school-slug.mloexastudio.com
    const baseDomain = process.env.SCHOOL_APP_DOMAIN
      ?.trim()
      .toLowerCase();

    if (baseDomain && hostname.endsWith(`.${baseDomain}`)) {
      subdomain = hostname.slice(0, -(baseDomain.length + 1));
    }
  }

  // Not a school subdomain
  if (
    !subdomain ||
    subdomain.includes(".") ||
    RESERVED_SUBDOMAINS.has(subdomain)
  ) {
    return NextResponse.next();
  }

  // School subdomain homepage → same subdomain's /login
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  // School subdomain /login → existing school-branded login page
  if (request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/school/login";

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
