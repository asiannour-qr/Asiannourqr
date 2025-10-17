// lib/cart.ts

export type CartItem = {
  id: string;
  name: string;
  qty: number;
  price?: number;     // centimes
  personId?: string;  // P1, P2, ...
  comment?: string;   // (plus utilisé côté UI)
};

export type Cart = {
  tableId: string;
  items: CartItem[];
  updatedAt: number;
  peopleCount?: number;   // nb de convives
  tableComment?: string;  // commentaire global de table
};

// ----- Store mémoire global (dev) -----
const g = globalThis as any;
if (!g.__CARTS__) g.__CARTS__ = new Map<string, Cart>();
const CARTS: Map<string, Cart> = g.__CARTS__;

// Récupère (ou crée) le panier d'une table
export function getCart(tableId: string): Cart {
  const c = CARTS.get(tableId);
  if (c) return c;
  const fresh: Cart = {
    tableId,
    items: [],
    updatedAt: Date.now(),
    peopleCount: 1,
    tableComment: ""
  };
  CARTS.set(tableId, fresh);
  return fresh;
}

// Met à jour le nombre de personnes
export function setPeopleCount(tableId: string, count: number) {
  const cart = getCart(tableId);
  cart.peopleCount = Math.max(1, Math.min(12, Math.floor(count || 1)));
  cart.updatedAt = Date.now();
  return cart;
}

// Définit le commentaire global de table
export function setTableComment(tableId: string, text: string) {
  const cart = getCart(tableId);
  cart.tableComment = (text ?? "").slice(0, 300);
  cart.updatedAt = Date.now();
  return cart;
}

// Clé d'unicité (même produit + même prix + même personne + même commentaire)
function keyFor(it: { id: string; price?: number; personId?: string; comment?: string }) {
  return `${it.id}|${it.price ?? 0}|${it.personId ?? "-"}|${(it.comment ?? "").trim()}`;
}

// Ajouter 1 (fusionne selon keyFor)
export function addItem(
  tableId: string,
  payload: { id: string; name: string; price?: number; personId?: string; comment?: string }
) {
  const cart = getCart(tableId);
  const k = keyFor(payload);
  const found = cart.items.find(i => keyFor(i) === k);
  if (found) found.qty += 1;
  else cart.items.push({ ...payload, qty: 1 });
  cart.updatedAt = Date.now();
  return cart;
}

// Modifier quantité (+1 / -1) pour la bonne ligne
export function changeQty(
  tableId: string,
  payload: { id: string; price?: number; personId?: string; comment?: string; delta: number }
) {
  const cart = getCart(tableId);
  const k = keyFor(payload);
  const idx = cart.items.findIndex(i => keyFor(i) === k);
  if (idx >= 0) {
    cart.items[idx].qty += payload.delta;
    if (cart.items[idx].qty <= 0) cart.items.splice(idx, 1);
    cart.updatedAt = Date.now();
  }
  return cart;
}

// Vider panier (et remettre le commentaire à vide)
export function clearCart(tableId: string) {
  const cart = getCart(tableId);
  cart.items = [];
  cart.tableComment = ""; // <<< important : on efface le commentaire global
  cart.updatedAt = Date.now();
  return cart;
}

// Total en centimes
export function totalCents(cart: Cart) {
  return cart.items.reduce((sum, it) => sum + (it.price ?? 0) * it.qty, 0);
}

// (debug) récupérer tous les paniers
export function getAllCarts() {
  const m: Map<string, Cart> = g.__CARTS__ ?? new Map<string, Cart>();
  return Array.from(m.values());
}