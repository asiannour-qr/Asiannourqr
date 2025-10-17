// app/api/menus/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminSession } from "@/lib/admin-session";

export async function GET() {
    try {
        const menus = await prisma.menu.findMany({
            where: { active: true },
            orderBy: [{ position: "asc" }, { name: "asc" }],
            include: { groups: { orderBy: { position: "asc" } } },
        });
        return NextResponse.json({ menus });
    } catch (e: any) {
        return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const unauthorized = assertAdminSession();
    if (unauthorized) return unauthorized;
    try {
        const b = await req.json();
        const name = String(b?.name || "").trim();
        if (!name) return NextResponse.json({ status: "error", message: "name requis" }, { status: 400 });

        let priceCents = b?.priceCents;
        if (priceCents == null && b?.price != null) {
            const n = Number(String(b.price).replace(",", "."));
            if (!Number.isFinite(n)) return NextResponse.json({ status: "error", message: "prix invalide" }, { status: 400 });
            priceCents = Math.round(n * 100);
        }
        if (priceCents == null) return NextResponse.json({ status: "error", message: "price/priceCents requis" }, { status: 400 });

        const groupsData = Array.isArray(b?.groups) ? b.groups.map((g: any, i: number) => ({
            name: String(g?.name || `Groupe ${i + 1}`),
            categoryFilter: String(g?.categoryFilter || "Entrées"),
            minChoices: Number(g?.minChoices ?? 1),
            maxChoices: Number(g?.maxChoices ?? 1),
            position: Number(g?.position ?? (i + 1)),
        })) : [];

        const created = await prisma.menu.create({
            data: {
                name,
                priceCents,
                active: b?.active != null ? Boolean(b.active) : true,
                position: Number(b?.position ?? 0),
                groups: { create: groupsData },
            },
            include: { groups: true }
        });

        return NextResponse.json({ status: "ok", menu: created }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
    }
}
