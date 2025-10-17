// app/t/[tableId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import menu from "../../../data/products"; // ne pas changer ce chemin

// ====== Types locaux (alignés avec data/products.ts) ======
type Variant = { id: string; name: string; price?: number };
type Item = { id: string; name: string; price?: number; variants?: Variant[] };
type Cat = { id: string; name: string; items: Item[] };

type CartItem = {
  id: string;
  name: string;
  qty: number;
  price?: number;
  personId?: string;
};

function euros(cents?: number) {
  if (typeof cents !== "number") return "—";
  return `${(cents / 100).toFixed(2)} €`;
}

export default function TablePage() {
  // --------- Param table ---------
  const raw = useParams<{ tableId: string }>().tableId as unknown as string;
  const tableId = Array.isArray(raw) ? raw[0] : raw;

  // --------- Données carte ---------
  const cats = (menu as any).categories as Cat[];

  // --------- UI States ---------
  const [cart, setCart] = useState<{ items: CartItem[]; total: number }>({ items: [], total: 0 });
  const [people, setPeople] = useState<number>(1);
  const [activePerson, setActivePerson] = useState<string>("P1");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // Commentaire global de table (texte clair sur fond clair → borduré)
  const [tableComment, setTableComment] = useState<string>("");
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);

  // --------- Polling panier (API locale) ---------
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/tables/${tableId}/cart`, { cache: "no-store" });
        const data = await res.json();
        if (!alive || !data?.ok) return;

        setCart({ items: data.cart.items, total: data.total });

        const serverPeople = data.cart.peopleCount ?? 1;
        setPeople(serverPeople);
        const actNum = parseInt(activePerson.slice(1)) || 1;
        if (actNum > serverPeople) setActivePerson(`P${serverPeople}`);

        if (!isEditingComment) setTableComment(data.cart.tableComment ?? "");
      } catch { }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => { alive = false; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, isEditingComment]);

  // --------- Helpers API ---------
  const setPeopleOnServer = async (n: number) => {
    await fetch(`/api/tables/${tableId}/cart`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peopleCount: n }),
    });
  };

  const saveTableComment = async (text?: string) => {
    const body = { tableComment: typeof text === "string" ? text : tableComment };
    await fetch(`/api/tables/${tableId}/cart`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const add = async (payload: { id: string; name: string; price?: number }) => {
    await fetch(`/api/tables/${tableId}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, personId: activePerson }),
    });
  };

  const clear = async () => {
    await fetch(`/api/tables/${tableId}/cart`, { method: "DELETE" });
  };

  const sendToKitchen = async () => {
    try {
      setSending(true);
      // Sauve le commentaire puis envoie
      await saveTableComment();
      const res = await fetch(`/api/tables/${tableId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert("Impossible d'envoyer : " + (data?.error ?? res.statusText));
        return;
      }
      // Reset visuel + serveur
      setTableComment("");
      await saveTableComment("");
      alert("Commande envoyée en cuisine ✅");
    } catch (e: any) {
      alert("Erreur : " + (e?.message ?? "inconnue"));
    } finally {
      setSending(false);
    }
  };

  const toggle = (id: string) =>
    setOpenIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // --------- Aplatir carte (pour menus, filtres) ---------
  type FlatItem = { id: string; name: string; price?: number };
  const flatItems: FlatItem[] = useMemo(() => {
    const out: FlatItem[] = [];
    for (const cat of cats) {
      for (const it of cat.items) {
        if (it.variants?.length) {
          for (const v of it.variants) out.push({ id: v.id, name: `${it.name} — ${v.name}`, price: v.price });
        } else {
          out.push({ id: it.id, name: it.name, price: it.price });
        }
      }
    }
    return out;
  }, [cats]);

  const byCat = (needle: string): FlatItem[] => {
    const n = needle.toLowerCase();
    const pick: FlatItem[] = [];
    for (const c of cats) {
      const cname = (c.name || "").toLowerCase();
      if (cname.includes(n)) {
        for (const it of c.items) {
          if (it.variants?.length) {
            for (const v of it.variants) pick.push({ id: v.id, name: `${it.name} — ${v.name}`, price: v.price });
          } else pick.push({ id: it.id, name: it.name, price: it.price });
        }
      }
    }
    return pick;
  };

  const entrees = useMemo(() => byCat("entrée"), [cats]);
  const yakis = useMemo(() => byCat("yakitori"), [cats]);
  const platsStarter = useMemo(() => byCat("starter"), [cats]);
  const platsSilver = useMemo(() => byCat("silver"), [cats]);
  const platsGold = useMemo(() => byCat("gold"), [cats]);
  const boissons = useMemo(() => byCat("boisson"), [cats]); // si tu ajoutes la catégorie

  // --------- MENUS CHAUDS (builder) ---------
  type MenuSpec =
    | { key: "classic"; name: "Asian Classic"; price: number; needs: { entree: 1; yakitori: 2; starter: 1 } }
    | { key: "classic_plus"; name: "Asian Classic +"; price: number; needs: { entree: 1; yakitori: 2; silver: 1 } }
    | { key: "royal"; name: "Asian Royal"; price: number; needs: { entreeOrYak: true; gold: 1; drink: 1 } }
    | { key: "classe_b"; name: "Asian Classe B"; price: number; needs: { entreeOrYak: true; silver: 1; drink: 1 } }
    | { key: "express"; name: "Asian Express"; price: number; needs: { entree: 1; silver: 1; drink: 1 } }
    | { key: "kids"; name: "Asian Kid’s"; price: number; needs: { entree2pcs: 1; kidsSide: 1; fixedDessertDrink: true } };

  const MENUS: MenuSpec[] = [
    { key: "classic", name: "Asian Classic", price: 1690, needs: { entree: 1, yakitori: 2, starter: 1 } },
    { key: "classic_plus", name: "Asian Classic +", price: 1890, needs: { entree: 1, yakitori: 2, silver: 1 } },
    { key: "royal", name: "Asian Royal", price: 1890, needs: { entreeOrYak: true, gold: 1, drink: 1 } },
    { key: "classe_b", name: "Asian Classe B", price: 1590, needs: { entreeOrYak: true, silver: 1, drink: 1 } },
    { key: "express", name: "Asian Express", price: 1390, needs: { entree: 1, silver: 1, drink: 1 } },
    { key: "kids", name: "Asian Kid’s", price: 890, needs: { entree2pcs: 1, kidsSide: 1, fixedDessertDrink: true } },
  ];

  const [builderOpen, setBuilderOpen] = useState<boolean>(false);
  const [menuSpec, setMenuSpec] = useState<MenuSpec | null>(null);

  // Sélections builder
  const [selEntree, setSelEntree] = useState<string | null>(null);
  const [selYak1, setSelYak1] = useState<string | null>(null);
  const [selYak2, setSelYak2] = useState<string | null>(null);
  const [selStarter, setSelStarter] = useState<string | null>(null);
  const [selSilver, setSelSilver] = useState<string | null>(null);
  const [selGold, setSelGold] = useState<string | null>(null);
  const [selDrink, setSelDrink] = useState<string | null>(null);
  const [chooseEntreeOrYak, setChooseEntreeOrYak] = useState<"entree" | "yak">("entree");
  const [selKidsSide, setSelKidsSide] = useState<string | null>(null);

  const resetBuilder = () => {
    setSelEntree(null); setSelYak1(null); setSelYak2(null);
    setSelStarter(null); setSelSilver(null); setSelGold(null);
    setSelDrink(null); setChooseEntreeOrYak("entree"); setSelKidsSide(null);
  };

  const openMenu = (spec: MenuSpec) => {
    setMenuSpec(spec);
    resetBuilder();
    setBuilderOpen(true);
  };

  const itemById = (id: string | null): FlatItem | null =>
    (id ? flatItems.find((i) => i.id === id) ?? null : null);

  const canSubmitMenu = (): boolean => {
    if (!menuSpec) return false;
    const n = (menuSpec.needs as any);
    if (n.entree && !selEntree) return false;
    if (n.yakitori && (!selYak1 || !selYak2)) return false;
    if (n.starter && !selStarter) return false;
    if (n.silver && !selSilver) return false;
    if (n.gold && !selGold) return false;
    if (n.drink && !selDrink) return false;
    if (n.entreeOrYak) {
      if (chooseEntreeOrYak === "entree") { if (!selEntree) return false; }
      else { if (!selYak1 || !selYak2) return false; }
    }
    if (n.entree2pcs && !selEntree) return false;
    if (n.kidsSide && !selKidsSide) return false;
    return true;
  };

  const addZeroLine = async (mkey: string, it: FlatItem | null) => {
    if (!it) return;
    await add({ id: `menu:${mkey}:${it.id}`, name: it.name, price: 0 });
  };

  const addMenuToCart = async () => {
    if (!menuSpec) return;
    if (!canSubmitMenu()) { alert("Merci de compléter tous les choix du menu."); return; }

    const mk = menuSpec.key;

    // 1) ligne payante
    await add({ id: `menu:${mk}`, name: `MENU — ${menuSpec.name}`, price: menuSpec.price });

    // 2) composants (gratuits)
    const n = (menuSpec.needs as any);
    if (n.entree) await addZeroLine(mk, itemById(selEntree));
    if (n.yakitori) { await addZeroLine(mk, itemById(selYak1)); await addZeroLine(mk, itemById(selYak2)); }
    if (n.starter) await addZeroLine(mk, itemById(selStarter));
    if (n.silver) await addZeroLine(mk, itemById(selSilver));
    if (n.gold) await addZeroLine(mk, itemById(selGold));
    if (n.drink) await addZeroLine(mk, itemById(selDrink));
    if (n.entreeOrYak) {
      if (chooseEntreeOrYak === "entree") await addZeroLine(mk, itemById(selEntree));
      else { await addZeroLine(mk, itemById(selYak1)); await addZeroLine(mk, itemById(selYak2)); }
    }
    if (n.entree2pcs) await addZeroLine(mk, itemById(selEntree));
    if (n.kidsSide) await addZeroLine(mk, itemById(selKidsSide));
    if (n.fixedDessertDrink) {
      await add({ id: `menu:${mk}:dessert`, name: "Compote (incluse menu Kid’s)", price: 0 });
      await add({ id: `menu:${mk}:drink`, name: "Capri Sun (inclus menu Kid’s)", price: 0 });
    }

    setBuilderOpen(false);
    resetBuilder();
    alert("Menu ajouté au panier ✅");
  };

  // ====== RENDER ======
  return (
    <main className="page-shell space-y-8">
      {/* Header clair */}
      <div className="surface-card-strong flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h1 className="h1">Table {tableId}</h1>
          <div className="text-sm text-[var(--brand-accent)] mt-1">Commande à table</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenIds(cats.map((c) => c.id))} className="btn-ghost">Tout ouvrir</button>
          <button onClick={() => setOpenIds([])} className="btn-ghost">Tout fermer</button>
          <a href="/menu" className="btn-primary">Voir la carte</a>
        </div>
      </div>

      {/* Nb de personnes + personnes actives */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 card">
        <div className="flex items-center gap-2">
          <span className="text-sm">Nb personnes :</span>
          <button
            onClick={() => { const n = Math.max(1, people - 1); setPeople(n); setPeopleOnServer(n); const actNum = parseInt(activePerson.slice(1)) || 1; if (actNum > n) setActivePerson(`P${n}`); }}
            className="btn-ghost text-lg"
          >−</button>
          <span className="px-3 py-1 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-card)]">{people}</span>
          <button
            onClick={() => { const n = Math.min(12, people + 1); setPeople(n); setPeopleOnServer(n); }}
            className="btn-ghost text-lg"
          >+</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: people }).map((_, i) => {
            const pid = `P${i + 1}`;
            const active = pid === activePerson;
            return (
              <button key={pid}
                onClick={() => setActivePerson(pid)}
                className={`btn-ghost px-3 py-1 rounded-full border ${active ? "bg-[var(--brand-primary)] text-white border-transparent" : ""}`}
              >
                {pid}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commentaire GLOBAL de la table */}
      <div className="mb-6 card">
        <div className="font-semibold text-[var(--brand-primary)] mb-2">📝 Commentaire de table (optionnel)</div>
        <textarea
          value={tableComment}
          onFocus={() => setIsEditingComment(true)}
          onBlur={async () => { setIsEditingComment(false); await saveTableComment(); }}
          onChange={(e) => setTableComment(e.target.value.slice(0, 300))}
          className="w-full rounded-xl border border-[var(--brand-border)] bg-white/70 p-3 text-[var(--brand-text)]"
          placeholder="Ex : Allergies cacahuètes, peu épicé, couverts en plus… (300 caractères max)"
          rows={3}
          maxLength={300}
          style={{ color: "var(--brand-text)" }}
        />
        <div className="mt-2 text-xs text-[var(--brand-accent)]/80">Enregistré quand tu quittes la zone et avant l’envoi en cuisine.</div>
      </div>

      {/* ===== MENUS CHAUDS (builder clair) ===== */}
      <div className="mb-8 card">
        <div className="flex items-center justify-between mb-3">
          <span className="h2">MENUS CHAUDS – Composer</span>
          <span className="text-sm text-[var(--brand-accent)]">Choix guidés</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MENUS.map(m => (
            <div key={m.key} className="rounded-xl border border-[var(--brand-border)] bg-white/70 p-3">
              <div className="font-semibold text-[var(--brand-text)]">{m.name}</div>
              <div className="text-sm text-[var(--brand-accent)]">{euros(m.price)}</div>
              <button onClick={() => openMenu(m)} className="mt-2 w-full btn-primary">Composer</button>
            </div>
          ))}
        </div>
      </div>

      {/* Accordéons catégories (carte libre) */}
      <div className="space-y-4 mb-10">
        {cats.map((cat) => {
          const isOpen = openIds.includes(cat.id);
          return (
            <div key={cat.id} className="rounded-2xl border border-[var(--brand-border)] overflow-hidden">
              <button onClick={() => toggle(cat.id)}
                className="w-full flex items-center justify-between px-5 py-3 bg-[var(--brand-card)] hover:opacity-90">
                <span className="text-[var(--brand-primary)] font-semibold">{cat.name}</span>
                <span className="text-sm text-[var(--brand-text)]">{isOpen ? "replier" : "déplier"}</span>
              </button>

              {isOpen && (
                <div className="p-4 bg-[var(--brand-bg)]">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.items.map((it) => {
                      const hasVariants = Array.isArray(it.variants) && it.variants.length > 0;
                      return (
                        <div key={it.id} className="rounded-xl border border-[var(--brand-border)] bg-white p-3">
                          <div className="font-medium text-[var(--brand-text)]">
                            {it.name}{" "}
                            {typeof it.price === "number" && (<span className="text-[var(--brand-accent)]">• {euros(it.price)}</span>)}
                          </div>

                          {/* Article simple */}
                          {!hasVariants && (
                            <div className="mt-2">
                              <button
                                onClick={() => add({ id: it.id, name: it.name, price: it.price })}
                                className="w-full btn-primary"
                              >
                                Ajouter à {activePerson}
                              </button>
                            </div>
                          )}

                          {/* Variantes */}
                          {hasVariants && (
                            <div className="mt-3 grid gap-2">
                              {it.variants!.map((v) => (
                                <div key={v.id} className="flex items-center justify-between rounded-lg border border-[var(--brand-border)] bg-white px-3 py-2">
                                  <span className="max-w-[60%] text-[var(--brand-text)]">{v.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-[var(--brand-accent)]">{euros(v.price)}</span>
                                    <button
                                      onClick={() => add({ id: v.id, name: `${it.name} — ${v.name}`, price: v.price })}
                                      className="btn-primary text-xs px-3 py-1"
                                    >
                                      Ajouter {activePerson}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panier */}
      <section className="border-t border-[var(--brand-border)] pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="h2">🧾 Panier (partagé)</h2>
          <button onClick={clear} className="btn-ghost text-[var(--brand-accent)]">Vider</button>
        </div>

        {cart.items.length === 0 ? (
          <p className="text-[var(--brand-text)]/70">Aucun plat ajouté pour le moment.</p>
        ) : (
          <div className="mb-4 space-y-4">
            {Object.entries(
              cart.items.reduce<Record<string, CartItem[]>>((acc, it) => {
                const k = it.personId ?? "P1";
                (acc[k] ||= []).push(it);
                return acc;
              }, {})
            ).map(([pid, items]) => (
              <div key={pid} className="card">
                <div className="font-semibold mb-1 text-[var(--brand-primary)]">{pid}</div>
                <ul>
                  {items.map((o, idx) => (
                    <li key={`${pid}|${o.id}|${o.price ?? 0}|${idx}`} className="flex items-center justify-between border-b border-[var(--brand-border)] py-2 gap-2">
                      <div className="max-w-[60%]">{o.name}</div>
                      <div className="text-sm text-[var(--brand-accent)]">{euros(o.price ?? 0)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{euros(cart.total)}</span>
        </div>

        <button
          disabled={cart.items.length === 0 || sending}
          onClick={sendToKitchen}
          className="mt-4 w-full btn-primary py-3 disabled:opacity-50"
        >
          {sending ? "Envoi..." : "Envoyer en cuisine"}
        </button>
      </section>

      {/* ---------- MODAL MENU BUILDER (clair) ---------- */}
      {builderOpen && menuSpec && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--brand-card)] rounded-2xl shadow-lg border border-[var(--brand-border)]">
            <div className="p-4 border-b border-[var(--brand-border)] flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-[var(--brand-primary)]">Composer — {menuSpec.name}</div>
                <div className="text-sm text-[var(--brand-accent)]">{euros(menuSpec.price)}</div>
              </div>
              <button onClick={() => setBuilderOpen(false)} className="btn-ghost">Fermer</button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              {"entree" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Entrée (1)</div>
                  <select
                    value={selEntree ?? ""}
                    onChange={(e) => setSelEntree(e.target.value || null)}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2"
                  >
                    <option value="">— Choisir une entrée —</option>
                    {entrees.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
              )}

              {"yakitori" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Yakitoris (2)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select value={selYak1 ?? ""} onChange={(e) => setSelYak1(e.target.value || null)}
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                      <option value="">— Yakitori #1 —</option>
                      {yakis.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                    <select value={selYak2 ?? ""} onChange={(e) => setSelYak2(e.target.value || null)}
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                      <option value="">— Yakitori #2 —</option>
                      {yakis.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {"starter" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Plat Starter (1)</div>
                  <select value={selStarter ?? ""} onChange={(e) => setSelStarter(e.target.value || null)}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                    <option value="">— Choisir un Starter —</option>
                    {platsStarter.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
              )}

              {"silver" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Plat Silver (1)</div>
                  <select value={selSilver ?? ""} onChange={(e) => setSelSilver(e.target.value || null)}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                    <option value="">— Choisir un Silver —</option>
                    {platsSilver.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
              )}

              {"gold" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Plat Gold (1)</div>
                  <select value={selGold ?? ""} onChange={(e) => setSelGold(e.target.value || null)}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                    <option value="">— Choisir un Gold —</option>
                    {platsGold.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
              )}

              {"drink" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Boisson (1)</div>
                  <select value={selDrink ?? ""} onChange={(e) => setSelDrink(e.target.value || null)}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                    <option value="">— Choisir une boisson —</option>
                    {boissons.length === 0
                      ? <option>— (Ajoute une catégorie “Boissons”) —</option>
                      : boissons.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </div>
              )}

              {"entreeOrYak" in (menuSpec.needs as any) && (
                <div className="rounded-xl border border-[var(--brand-border)] bg-white p-3">
                  <div className="font-medium mb-2">Choix : 1 Entrée OU 2 Yakitoris</div>
                  <div className="flex gap-3 mb-3">
                    <label className="inline-flex items-center gap-1 text-sm">
                      <input type="radio" name="choice1" checked={chooseEntreeOrYak === "entree"} onChange={() => setChooseEntreeOrYak("entree")} />
                      Entrée
                    </label>
                    <label className="inline-flex items-center gap-1 text-sm">
                      <input type="radio" name="choice1" checked={chooseEntreeOrYak === "yak"} onChange={() => setChooseEntreeOrYak("yak")} />
                      2 Yakitoris
                    </label>
                  </div>

                  {chooseEntreeOrYak === "entree" ? (
                    <select value={selEntree ?? ""} onChange={(e) => setSelEntree(e.target.value || null)}
                      className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                      <option value="">— Choisir une entrée —</option>
                      {entrees.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select value={selYak1 ?? ""} onChange={(e) => setSelYak1(e.target.value || null)}
                        className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                        <option value="">— Yakitori #1 —</option>
                        {yakis.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                      <select value={selYak2 ?? ""} onChange={(e) => setSelYak2(e.target.value || null)}
                        className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                        <option value="">— Yakitori #2 —</option>
                        {yakis.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {"kidsSide" in (menuSpec.needs as any) && (
                <div>
                  <div className="font-medium mb-1 text-[var(--brand-text)]">Accompagnement Kid’s (1)</div>
                  <select value={selKidsSide ?? ""} onChange={(e) => setSelKidsSide(e.target.value || null)}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-white p-2">
                    <option value="">— Choisir —</option>
                    {/* Le contenu exact dépend des items présents dans la carte */}
                    {/* On propose “Riz nature”, “Nouilles légumes”, “Riz cantonnais” si détectés */}
                    {["riz nature", "nouilles", "cantonnais"].map((key) =>
                      flatItems.filter(i => i.name.toLowerCase().includes(key)).map((it) =>
                        <option key={it.id} value={it.id}>{it.name}</option>
                      )
                    )}
                  </select>
                  <div className="text-xs text-[var(--brand-accent)] mt-1">Inclut aussi : Compote + Capri Sun.</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--brand-border)] flex items-center justify-between">
              <div className="text-sm text-[var(--brand-accent)]">Ajouté pour <b>{activePerson}</b> • Total menu {euros(menuSpec.price)}</div>
              <button
                disabled={!canSubmitMenu()}
                onClick={addMenuToCart}
                className="btn-primary"
              >
                Ajouter le menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
