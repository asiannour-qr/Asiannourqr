import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth";

export function assertAdminSession() {
    const cookieValue = cookies().get(ADMIN_SESSION_COOKIE)?.value ?? "";
    if (!cookieValue.startsWith("ok:")) {
        return NextResponse.json({ status: "error", message: "Non autorisé" }, { status: 401 });
    }
    return null;
}
