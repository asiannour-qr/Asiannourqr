import { NextResponse } from "next/server";
import { getAdminCreds, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL, createSessionValue } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { user: envUser, pass: envPass } = getAdminCreds();
        const body = await req.json().catch(() => ({}));
        const rawLogin = body?.user ?? body?.username ?? "";
        const rawPassword = body?.password ?? "";
        const submittedUser = typeof rawLogin === "string" ? rawLogin.trim() : "";
        const submittedPass = typeof rawPassword === "string" ? rawPassword.trim() : "";
        const requiredUser = envUser.trim();
        const requiredPass = envPass.trim();

        if (process.env.NODE_ENV !== "production") {
            console.log("[admin-login]", { submittedUser, requiredUser, hasPassword: submittedPass.length > 0, requiredPassLength: requiredPass.length });
        }

        if (!submittedUser || !submittedPass) {
            return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
        }
        if (submittedUser !== requiredUser || submittedPass !== requiredPass) {
            return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
        }

        const res = NextResponse.json({ ok: true });
        res.cookies.set(ADMIN_SESSION_COOKIE, createSessionValue(), {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: Math.floor(ADMIN_SESSION_TTL / 1000),
        });
        return res;
    } catch (e) {
        return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
    }
}
