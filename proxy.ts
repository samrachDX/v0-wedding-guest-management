import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/guests/:path*", "/gifts/:path*", "/export/:path*", "/settings/:path*", "/users/:path*"],
}
