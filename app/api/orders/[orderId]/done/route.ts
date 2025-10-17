import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma"; // <= RELATIF OK

export async function POST(
    _req: Request,
    { params }: { params: { orderId: string } }
) {
    await prisma.order.update({
        where: { id: params.orderId },
        data: { status: "DONE" },
    });
    return NextResponse.json({ ok: true });
}