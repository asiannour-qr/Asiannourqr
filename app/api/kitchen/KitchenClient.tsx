"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type OrderItem = { id: string; name: string };
type Order = {
    id: string;
    tableId: string;
    total: number;
    comment?: string | null;
    status: string;    // ex: "NEW"
    createdAt: string; // ISO string
    items: OrderItem[];
};

export default function KitchenClient() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const lastFetch = useRef<string>("—");

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/orders", {
                cache: "no-store",
                headers: { "cache-control": "no-store" },
            });
            if (!res.ok) throw new Error("GET /api/orders a échoué");
            const data = (await res.json()) as { orders: Order[] };

            const list = (data.orders ?? []).slice().sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setOrders(list);
            lastFetch.current = new Date().toISOString().slice(11, 19);
        } catch (e: any) {
            toast.error(e?.message || "Erreur de rafraîchissement");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(); // premier affichage
    }, [fetchOrders]);

    async function updateStatus(id: string, next: string) {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            if (!res.ok) throw new Error("PATCH échoué");
            toast.success(`Statut → ${next}`);
            fetchOrders();
        } catch (e: any) {
            toast.error(e?.message || "Erreur mise à jour");
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-6">
            <Toaster position="top-right" />
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold">Cuisine — Commandes</h1>
                <button
                    onClick={fetchOrders}
                    className="px-3 py-1 rounded-xl border hover:bg-gray-50"
                    disabled={loading}
                >
                    {loading ? "Chargement…" : "Rafraîchir"}
                </button>
                <span className="text-sm opacity-60">Dernier fetch: {lastFetch.current}</span>
            </div>

            {orders.length === 0 ? (
                <p className="opacity-60">Aucune commande pour le moment.</p>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {orders.map((o) => (
                        <div key={o.id} className="rounded-2xl shadow p-4 border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">Table {o.tableId}</div>
                                <span className="px-2 py-1 text-xs rounded bg-slate-800 text-white">
                                    {o.status}
                                </span>
                            </div>

                            {o.comment && (
                                <div className="text-sm mb-2">
                                    <span className="font-medium">Commentaire :</span>{" "}
                                    <span className="italic">{o.comment}</span>
                                </div>
                            )}

                            <ul className="list-disc pl-5 text-sm mb-3">
                                {o.items.map((it) => (
                                    <li key={it.id}>{it.name}</li>
                                ))}
                            </ul>

                            <div className="flex gap-2 justify-end">
                                {o.status !== "IN_PROGRESS" && (
                                    <button
                                        onClick={() => updateStatus(o.id, "IN_PROGRESS")}
                                        className="px-3 py-1 rounded-xl border"
                                    >
                                        Démarrer
                                    </button>
                                )}
                                {o.status !== "READY" && (
                                    <button
                                        onClick={() => updateStatus(o.id, "READY")}
                                        className="px-3 py-1 rounded-xl border"
                                    >
                                        Prête
                                    </button>
                                )}
                                {o.status !== "SERVED" && (
                                    <button
                                        onClick={() => updateStatus(o.id, "SERVED")}
                                        className="px-3 py-1 rounded-xl bg-black text-white"
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
    );
}