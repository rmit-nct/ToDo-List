import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { compare } from "bcryptjs";
import { db } from "./db";
import { emailSchema, passwordSchema, rateLimit, HttpError } from "./security";
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials) {
        const email = emailSchema.safeParse(credentials?.email);
        const password = passwordSchema.safeParse(credentials?.password);
        if (!email.success || !password.success) return null;
        await rateLimit("login", email.data, 15);
        const database = await db();
        const user = await database
          .collection("users")
          .findOne({ email: email.data });
        const valid = await compare(
          password.data,
          user?.passwordHash ||
            "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
        );
        if (!user || !valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
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
          email: user.email,
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
