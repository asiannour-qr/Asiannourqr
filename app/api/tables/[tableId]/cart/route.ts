// app/api/tables/[tableId]/cart/route.ts
import { NextResponse } from "next/server";
import { addItem, changeQty, clearCart, getCart, setPeopleCount, setTableComment, totalCents } from "../../../../../lib/cart";

export async function GET(_req: Request, { params }: { params: { tableId: string } }) {
  const cart = getCart(params.tableId);
  return NextResponse.json({ ok: true, cart, total: totalCents(cart) });
}

// POST: { id, name, price?, personId? }  -> ajoute 1
export async function POST(req: Request, { params }: { params: { tableId: string } }) {
  const body = await req.json();
  const cart = addItem(params.tableId, {
    id: String(body.id),
    name: String(body.name),
    price: typeof body.price === "number" ? body.price : undefined,
    personId: body.personId ? String(body.personId) : undefined,
    // on ignore ici body.comment pour éviter les notes par plat
  });
  return NextResponse.json({ ok: true, cart, total: totalCents(cart) });
}

// PATCH: { peopleCount } OU { tableComment } OU { id, price?, personId?, delta }
export async function PATCH(req: Request, { params }: { params: { tableId: string } }) {
  const body = await req.json();

  if (typeof body.peopleCount === "number") {
    const cart = setPeopleCount(params.tableId, body.peopleCount);
    return NextResponse.json({ ok: true, cart, total: totalCents(cart) });
  }

  if (typeof body.tableComment === "string") {
    const cart = setTableComment(params.tableId, body.tableComment);
    return NextResponse.json({ ok: true, cart, total: totalCents(cart) });
  }

  // ajustement quantité d'une ligne
  const cart = changeQty(params.tableId, {
    id: String(body.id),
    price: typeof body.price === "number" ? body.price : undefined,
    personId: body.personId ? String(body.personId) : undefined,
    delta: Number(body.delta),
  });
  return NextResponse.json({ ok: true, cart, total: totalCents(cart) });
}

// DELETE: vide le panier
export async function DELETE(_req: Request, { params }: { params: { tableId: string } }) {
  const cart = clearCart(params.tableId);
  return NextResponse.json({ ok: true, cart, total: totalCents(cart) });
}