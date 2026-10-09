import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/prisma/db";
import { verifyPassword } from "@/lib/auth/password";
import { getSchoolFromHost } from "@/lib/tenant/school";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  host: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        host: { label: "Host", type: "text" },
      },

      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password, host } = result.data;

        const user = await db.orm.public.User.where((u) =>
          u.email.eq(email.toLowerCase()),
        ).first();

        if (!user || !user.isActive) {
          return null;
        }

        if (host) {
          const school = await getSchoolFromHost(host);

          if (!school || school.status !== "ACTIVE") {
            return null;
          }

          if (user.schoolId !== school.id) {
            return null;
          }
        }

        const passwordValid = await verifyPassword(password, user.passwordHash);

        if (!passwordValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name ?? undefined,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.schoolId = token.schoolId;

      return session;
    },
  },
});
