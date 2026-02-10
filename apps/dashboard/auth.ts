import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname === "/login"
      const isOnPublicPage = nextUrl.pathname === "/"
      
      // Public pages don't require auth
      if (isOnPublicPage) {
        return true
      }
      
      // Redirect logged-in users away from login page
      if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL("/profile", nextUrl))
      }
      
      // Login page is accessible to everyone
      if (isOnLoginPage) {
        return true
      }
      
      // All other pages require authentication
      return isLoggedIn
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
