import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { usernameSchema, rateLimit, HttpError } from "./security";
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Username",
      credentials: { username: { label: "Username", type: "text" } },
      async authorize(credentials, request) {
        const parsed = usernameSchema.safeParse(credentials?.username);
        if (!parsed.success) return null;
        const username = parsed.data;
        const ip = String(
          request.headers?.["x-vercel-forwarded-for"] ||
            request.headers?.["x-forwarded-for"] ||
            "local",
        ).split(",")[0];
        await rateLimit("username-login-ip", ip, 60);
        await rateLimit("username-login", username, 30);
        const database = await db();
        // This namespace cannot match a legacy email/password identity.
        const identity = { username, authMode: "username" };
        let user;
        try {
          user = await database.collection("users").findOneAndUpdate(
            identity,
            {
              $setOnInsert: {
                ...identity,
                id: randomUUID(),
                name: username,
                // Internal unique key for the existing email index; never exposed as an email.
                email: `username:${username}`,
                sessionVersion: 0,
                theme: "system",
                createdAt: new Date(),
              },
            },
            { upsert: true, returnDocument: "after" },
          );
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
          user = await database.collection("users").findOne(identity);
        }
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          version: user.sessionVersion || 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.version = (user as typeof user & { version: number }).version;
      }
      return token;
    },
    async session({ session, token }) {
      const database = await db();
      const user = await database
        .collection("users")
        .findOne(
          { id: token.uid as string, sessionVersion: token.version as number },
          { projection: { passwordHash: 0, recoveryHash: 0 } },
        );
      if (!user) return { ...session, user: undefined };
      return {
        ...session,
        user: {
          id: user.id,
          name: user.name,
          email: user.authMode === "username" ? "" : user.email,
          username: user.username,
          theme: user.theme || "system",
        },
      };
    },
  },
};
export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    throw new HttpError(401, "Please sign in to continue.");
  return session.user;
}
