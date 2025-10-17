"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import toast, { Toaster } from "react-hot-toast";

type OrderItem = { id: string; name: string };
type Order = {
  id: string;
  tableId: string;
  total: number;
  comment?: string | null;
  status: "NEW" | "IN_PROGRESS" | "READY" | "SERVED" | "CANCELED" | string;
  createdAt: string; // ISO string
  items: OrderItem[];
};

const TICKET_WIDTH = "80mm"; // Changer en "58mm" pour imprimantes thermiques plus étroites.
const AUTO_PRINT_STORAGE_KEY = "kitchen:autoPrint";
const RESTAURANT_NAME = process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? "Asian Nour";

function statusBadgeClasses(s: string) {
  switch (s) {
    case "NEW": return "bg-red-600 text-white";
    case "IN_PROGRESS": return "bg-amber-500 text-black";
    case "READY": return "bg-emerald-600 text-white";
    case "SERVED": return "bg-gray-400 text-black";
    case "CANCELED": return "bg-gray-800 text-white";
    default: return "bg-slate-600 text-white";
  }
}

export default function KitchenPage() {
  const SOUND_ENABLED = process.env.NEXT_PUBLIC_KITCHEN_SOUND_ENABLED !== "false";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [hideServed, setHideServed] = useState(true);
  const lastFetch = useRef<string>("—");
  const knownIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const autoPrintRef = useRef(false);
  const printedAutoIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const Ctor = (window.AudioContext ?? (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!Ctor) return null;
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new Ctor();
      audioCtxRef.current = ctx;
    }
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // ignore resume errors (browser restrictions)
      }
    }
    return ctx;
  }, []);

  const playBeep = useCallback(
    async (count: number) => {
      if (!SOUND_ENABLED) return;
      const ctx = await ensureAudioContext();
      if (!ctx) return;
      const bursts = Math.max(1, Math.min(3, Math.floor(count)));
      for (let i = 0; i < bursts; i += 1) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        const start = ctx.currentTime + i * 0.32;
        const end = start + 0.3;
        osc.frequency.setValueAtTime(900, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.5, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
      }
    },
    [ensureAudioContext]
  );

  const ticketContainerStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "none",
    overflow: "hidden",
    opacity: 0,
    pointerEvents: "none",
    zIndex: -1,
  };

  const formatCurrency = useCallback((cents: number) => `${(cents / 100).toFixed(2)} €`, []);

  const formatTime = useCallback((iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      return now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }, []);

  const buildTicket = useCallback((order: Order) => {
    const el = ticketRef.current;
    if (!el) return;

    el.innerHTML = "";
    el.style.setProperty("--ticket-width", TICKET_WIDTH);
    el.setAttribute("data-order-id", order.id);

    const addDashed = () => {
      const line = document.createElement("div");
      line.className = "dashed";
      el.appendChild(line);
    };

    const addRow = (label: string, value: string) => {
      const row = document.createElement("div");
      row.className = "row no-break";
      row.style.fontSize = "11px";

      const left = document.createElement("span");
      left.textContent = label;
      const right = document.createElement("span");
      right.textContent = value;

      row.appendChild(left);
      row.appendChild(right);
      el.appendChild(row);
    };

    const addSpacer = (size = 4) => {
      const spacer = document.createElement("div");
      spacer.style.height = `${size}px`;
      el.appendChild(spacer);
    };

    const brand = document.createElement("div");
    brand.className = "no-break";
    brand.style.textAlign = "center";
    brand.style.fontWeight = "700";
    brand.style.fontSize = "14px";
    brand.textContent = RESTAURANT_NAME;
    el.appendChild(brand);

    const subtitle = document.createElement("div");
    subtitle.style.textAlign = "center";
    subtitle.style.fontSize = "11px";
    subtitle.textContent = "Ticket cuisine";
    el.appendChild(subtitle);

    addDashed();
    addRow("Commande", order.id.slice(0, 8).toUpperCase());
    addRow("Table", order.tableId);
    addRow("Heure", formatTime(order.createdAt));
    addRow("Statut", order.status);
    addDashed();

    const grouped = new Map<string, number>();
    order.items.forEach((item) => {
      const key = (item.name ?? "").trim() || "Article";
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    });

    grouped.forEach((qty, name) => {
      const line = document.createElement("div");
      line.className = "row no-break";
      line.style.alignItems = "flex-start";
      line.style.fontSize = "12px";

      const qtySpan = document.createElement("span");
      qtySpan.textContent = `${qty} ×`;
      qtySpan.style.minWidth = "24px";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      nameSpan.style.flex = "1";
      nameSpan.style.marginLeft = "6px";

      line.appendChild(qtySpan);
      line.appendChild(nameSpan);
      el.appendChild(line);
    });

    if (order.comment) {
      addDashed();
      const commentBlock = document.createElement("div");
      commentBlock.className = "no-break";
      commentBlock.style.fontStyle = "italic";
      commentBlock.style.whiteSpace = "pre-wrap";
      commentBlock.textContent = `Note : ${order.comment}`;
      el.appendChild(commentBlock);
    }

    addDashed();
    addRow("Total", formatCurrency(order.total));
    addSpacer(6);

    const footer = document.createElement("div");
    footer.style.textAlign = "center";
    footer.style.fontSize = "10px";
    footer.textContent = "Merci !";
    el.appendChild(footer);
  }, [formatCurrency, formatTime]);

  const printTicket = useCallback((order: Order) => {
    if (typeof window === "undefined") return;
    const el = ticketRef.current;
    if (!el) return;

    buildTicket(order);

    const cleanup = () => {
      if (ticketRef.current) {
        ticketRef.current.innerHTML = "";
        ticketRef.current.removeAttribute("data-order-id");
      }
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    // Astuce exploitation : lancer Chrome avec `--kiosk-printing` pour déclencher l'impression silencieuse côté cuisine.
    requestAnimationFrame(() => {
      window.print();
      setTimeout(cleanup, 400);
    });
  }, [buildTicket]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        cache: "no-store",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) throw new Error("GET /api/orders a échoué");

      const data = (await res.json()) as { orders: Order[] };
      const list = (data.orders ?? [])
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const incoming = list.filter((o) => !knownIds.current.has(o.id));
      if (incoming.length > 0) {
        incoming.forEach((o) => knownIds.current.add(o.id));
        toast.success(`${incoming.length} nouvelle(s) commande(s)`);
        void playBeep(incoming.length);

        if (autoPrintRef.current && bootstrappedRef.current) {
          incoming.forEach((order) => {
            if (printedAutoIdsRef.current.has(order.id)) return;
            printedAutoIdsRef.current.add(order.id);
            printTicket(order);
          });
        }
      } else if (knownIds.current.size === 0) {
        list.forEach((o) => knownIds.current.add(o.id));
      }

      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
      }

      const shown = hideServed ? list.filter((o) => o.status !== "SERVED") : list;
      setOrders(shown);
      lastFetch.current = new Date().toISOString().slice(11, 19);
    } catch (e: any) {
      toast.error(e?.message || "Erreur de rafraîchissement");
    } finally {
      setLoading(false);
    }
  }, [hideServed, playBeep, printTicket]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(AUTO_PRINT_STORAGE_KEY);
    if (stored === "1") {
      setAutoPrint(true);
      autoPrintRef.current = true;
    }
  }, []);

  useEffect(() => {
    autoPrintRef.current = autoPrint;
    if (typeof window === "undefined") return;
    if (autoPrint) {
      window.localStorage.setItem(AUTO_PRINT_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(AUTO_PRINT_STORAGE_KEY);
      printedAutoIdsRef.current.clear();
    }
  }, [autoPrint]);

  useEffect(() => {
    if (SOUND_ENABLED) void ensureAudioContext();
    const handler = () => {
      void ensureAudioContext();
      document.removeEventListener("pointerdown", handler);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [SOUND_ENABLED, ensureAudioContext]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(fetchOrders, 5000);
    return () => clearInterval(id);
  }, [auto, fetchOrders]);

  async function updateStatus(id: string, next: string) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.message || "PATCH échoué");
      }
      toast.success(`Statut → ${next}`);
      fetchOrders();
    } catch (e: any) {
      toast.error(e?.message || "Erreur mise à jour");
    }
  }

  return (
    <>
      <main className="page-shell max-w-6xl">
        <Toaster position="top-right" />
        <section className="surface-card-strong px-6 py-6 mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold flex-1 min-w-[220px]">Cuisine — Commandes</h1>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={fetchOrders} className="btn-ghost" disabled={loading}>
              {loading ? "Chargement…" : "Rafraîchir"}
            </button>
            <button onClick={() => setAuto((v) => !v)} className="btn-soft">
              Auto-refresh&nbsp;: {auto ? "ON" : "OFF"}
            </button>
            <button onClick={() => setHideServed((v) => !v)} className="btn-soft">
              Cacher “Servies”&nbsp;: {hideServed ? "ON" : "OFF"}
            </button>
            <label className="flex items-center gap-2 text-sm font-medium surface-muted-text">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
              />
              Auto-print à l’arrivée
            </label>
            <span className="surface-muted-text text-sm">Dernier fetch&nbsp;: {lastFetch.current}</span>
          </div>
        </section>

        {orders.length === 0 ? (
          <p className="surface-muted-text">Aucune commande pour le moment.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {orders.map((o) => (
              <div key={o.id} className="surface-card px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold tracking-wide">Table {o.tableId}</div>
                    <div className="text-xs surface-muted-text uppercase tracking-[0.28em]">
                      Total {(o.total / 100).toFixed(2)} €
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${statusBadgeClasses(o.status)}`}>
                    {o.status}
                  </span>
                </div>

                {o.comment && (
                  <div className="text-sm surface-panel px-4 py-3 rounded-2xl border border-[rgba(120,110,98,0.18)]">
                    <span className="font-medium uppercase tracking-[0.22em] text-xs block mb-1 surface-muted-text">
                      Commentaire
                    </span>
                    <span className="italic">{o.comment}</span>
                  </div>
                )}

                <ul className="space-y-2 text-sm">
                  {o.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between gap-3 border-b border-[rgba(120,110,98,0.12)] pb-2 last:border-0"
                    >
                      <span>{it.name}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() => printTicket(o)}
                    className="btn-ghost"
                    title="Imprimer un ticket pour cette commande"
                  >
                    Ticket
                  </button>
                  {o.status !== "IN_PROGRESS" && (
                    <button
                      onClick={() => updateStatus(o.id, "IN_PROGRESS")}
                      className="btn-soft"
                    >
                      Démarrer
                    </button>
                  )}
                  {o.status !== "READY" && (
                    <button
                      onClick={() => updateStatus(o.id, "READY")}
                      className="btn-soft"
                    >
                      Prête
                    </button>
                  )}
                  {o.status !== "SERVED" && (
                    <button
                      onClick={() => updateStatus(o.id, "SERVED")}
                      className="btn-primary"
                    >
                      Servie
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <div id="ticket" ref={ticketRef} style={ticketContainerStyle} aria-hidden="true" />
    </>
  );
}
