import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isAdminArea = pathname.startsWith("/admin");
    const isLoginPage = pathname === "/admin/login";

    if (isAdminArea && !isLoginPage) {
        const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
        if (!session || !session.startsWith("ok:")) {
            const url = req.nextUrl.clone();
            url.pathname = "/admin/login";
            url.searchParams.set("next", pathname);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
