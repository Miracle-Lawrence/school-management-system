import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  const hostname = host.split(":")[0].toLowerCase();

  if (!hostname.endsWith(".localhost")) {
    return NextResponse.next();
  }

  const subdomain = hostname.slice(0, -".localhost".length);

  if (!subdomain) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/school/login";

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login"],
};
