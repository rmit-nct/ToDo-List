import { withDatabase } from "../../../auth-lib/db";
import NextAuth from "next-auth";
import { authOptions } from "../../../auth-lib/auth";
const handler = NextAuth(authOptions);
async function route(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return withDatabase<Response>(() => handler(request, context));
}
export { route as GET, route as POST };
