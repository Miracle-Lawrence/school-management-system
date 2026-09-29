import "dotenv/config";

import { Temporal } from "@js-temporal/polyfill";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

if (!("Temporal" in globalThis)) {
  Object.defineProperty(globalThis, "Temporal", {
    value: Temporal,
    configurable: true,
    writable: false,
  });
}

export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});
