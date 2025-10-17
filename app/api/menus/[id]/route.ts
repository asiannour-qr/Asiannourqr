// app/api/menus/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminSession } from "@/lib/admin-session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const unauthorized = assertAdminSession();
    if (unauthorized) return unauthorized;
    try {
        const id = params.id;
        const b = await req.json();

        const data: any = {};
        if (b.name != null) data.name = String(b.name);
        if (b.active != null) data.active = Boolean(b.active);
        if (b.position != null) data.position = Number(b.position);
        if (b.priceCents != null) data.priceCents = Math.round(Number(b.priceCents));
        if (b.price != null) data.priceCents = Math.round(Number(String(b.price).replace(",", ".")) * 100);

        const updated = await prisma.menu.update({ where: { id }, data, include: { groups: true } });
        return NextResponse.json({ status: "ok", menu: updated });
    } catch (e: any) {
        return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    const unauthorized = assertAdminSession();
    if (unauthorized) return unauthorized;
    try {
        await prisma.menu.delete({ where: { id: params.id } });
        return NextResponse.json({ status: "ok" });
    } catch (e: any) {
        return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
    }
}
