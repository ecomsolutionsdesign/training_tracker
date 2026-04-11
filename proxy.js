// // proxy.js
// import { withAuth } from "next-auth/middleware";
// import { NextResponse } from "next/server";

// export default withAuth(
//   function middleware(req) {
//     const token = req.nextauth.token;
//     const path = req.nextUrl.pathname;

//     // Allow access to sign-in page
//     if (path.startsWith('/auth/signin')) {
//       return NextResponse.next();
//     }

//     // Protect /users route - admin only
//     if (path.startsWith('/users') && token?.role !== 'admin') {
//       return NextResponse.redirect(new URL('/', req.url));
//     }

//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token, req }) => {
//         // Allow auth pages without token
//         if (req.nextUrl.pathname.startsWith('/auth/')) {
//           return true;
//         }
//         // Require token for all other pages
//         return !!token;
//       },
//     },
//   }
// );

// // Protect all routes except auth pages and public assets
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public folder
//      */
//     '/((?!_next/static|_next/image|favicon.ico|public).*)',
//   ],
// };

// proxy.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PUBLIC_PAGES = ['/', '/attendance', '/pending', '/training-status', '/reports'];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/auth/')) return NextResponse.next();

    // Protect /users — admin only
    if (path.startsWith('/users') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Protect /employees, /topics, /position-topics — qa-officer and admin only
    if (
      (path.startsWith('/employees') ||
        path.startsWith('/topics') ||
        path.startsWith('/position-topics')) &&
      !['admin', 'qa-officer'].includes(token?.role)
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Protect /schedules — department-head, qa-officer, admin
    if (
      path.startsWith('/schedules') &&
      !['admin', 'qa-officer', 'department-head'].includes(token?.role)
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Always allow: auth pages, API routes, and public pages
        if (
          path.startsWith('/auth/') ||
          path.startsWith('/api/') ||          // ← KEY FIX: never block API routes
          PUBLIC_PAGES.includes(path)
        ) {
          return true;
        }

        // All other pages require login
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};