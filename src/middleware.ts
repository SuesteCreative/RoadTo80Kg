import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/edge";

export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
