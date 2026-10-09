import { db } from "@/prisma/db";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin", "platform"]);

export function getSchoolSlugFromHost(host: string) {
  const hostname = host.split(":")[0].toLowerCase();

  // Local development:
  // abc-international.localhost:3000
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.slice(0, -".localhost".length);

    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
      return null;
    }

    return subdomain;
  }

  // Production:
  // abc-international.yoursystem.com
  const baseDomain = process.env.SCHOOL_APP_DOMAIN?.toLowerCase();

  if (!baseDomain || !hostname.endsWith(`.${baseDomain}`)) {
    return null;
  }

  const subdomain = hostname.slice(0, -(baseDomain.length + 1));

  if (!subdomain || subdomain.includes(".")) {
    return null;
  }

  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return null;
  }

  return subdomain;
}

export async function getSchoolFromHost(host: string) {
  const slug = getSchoolSlugFromHost(host);

  if (!slug) {
    return null;
  }

  return db.orm.public.School.where((school) => school.slug.eq(slug)).first();
}
