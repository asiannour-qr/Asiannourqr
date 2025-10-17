"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Item = {
    id: string;
    name: string;
    priceCents: number;
    category: string;
    description?: string | null;
    imageUrl?: string | null;
    spicyLevel?: number | null;
    available: boolean;
    position: number;
};

function euros(cents: number) {
    return (cents / 100).toFixed(2);
}

export default function AdminMenuPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    // Form ajout
    const [name, setName] = useState("");
    const [price, setPrice] = useState<string>("0");
    const [category, setCategory] = useState("Plats");
    const [available, setAvailable] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/menu?all=1", { cache: "no-store" });
            const data = await res.json();
            setItems(data.items ?? []);
        } catch (e: any) {
            toast.error(e?.message || "Erreur chargement");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function createItem() {
        try {
            const body = {
                name: name.trim(),
                price: Number(price.replace(",", ".")),
                category: category.trim() || "Divers",
                available,
            };
            const res = await fetch("/api/menu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Création échouée");
            toast.success("Plat ajouté");
            setName("");
            setPrice("0");
            setAvailable(true);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Erreur création");
        }
    }

    async function updateField(id: string, patch: Partial<Item> & { price?: number }) {
        try {
            const body: any = { ...patch };
            if (body.price != null) {
                body.price = Number(body.price);
            }
            const res = await fetch(`/api/menu/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Mise à jour échouée");
            toast.success("Modifié");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Erreur modification");
        }
    }

    async function remove(id: string) {
        if (!confirm("Supprimer ce plat ?")) return;
        try {
            const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Suppression échouée");
            toast.success("Supprimé");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Erreur suppression");
        }
    }

    return (
        <main className="page-shell">
            <Toaster position="top-right" />

            <header className="section-heading mb-8">
                <span className="chip">Administration</span>
                <h1 className="section-heading__title">Gestion de la carte</h1>
                <p className="section-heading__subtitle">
                    Ajoutez, modifiez et organisez vos plats en un clin d’œil. Les modifications sont visibles
                    immédiatement sur l’application.
                </p>
            </header>

            {/* Ajout */}
            <section className="surface-card-strong px-6 py-6 mb-8 space-y-5">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-semibold">Ajouter un plat</h2>
                    <span className="surface-muted-text text-sm">Complétez les champs puis validez.</span>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                    <input
                        placeholder="Nom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="md:col-span-2"
                    />
                    <input
                        placeholder="Prix (€)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                    <input
                        placeholder="Catégorie"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-sm font-medium surface-muted-text">
                        <input
                            type="checkbox"
                            checked={available}
                            onChange={(e) => setAvailable(e.target.checked)}
                            className="w-4 h-4"
                        />
                        Disponible
                    </label>
                </div>
                <div className="flex justify-end">
                    <button onClick={createItem} className="btn-primary">
                        Ajouter
                    </button>
                </div>
            </section>

            {/* Liste */}
            <section className="surface-card px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Carte ({items.length})</h2>
                    <span className="surface-muted-text text-sm">
                        {loading ? "Chargement…" : "Edition en ligne"}
                    </span>
                </div>

                {loading ? (
                    <div className="surface-muted-text">Chargement…</div>
                ) : items.length === 0 ? (
                    <div className="surface-muted-text">Aucun plat pour le moment.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-theme">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Catégorie</th>
                                    <th>Prix</th>
                                    <th>Position</th>
                                    <th>Disponibilité</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it) => (
                                    <tr key={it.id}>
                                        <td>
                                            <input
                                                defaultValue={it.name}
                                                onBlur={(e) => updateField(it.id, { name: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                defaultValue={it.category}
                                                onBlur={(e) => updateField(it.id, { category: e.target.value })}
                                            />
                                        </td>
                                        <td className="flex items-center gap-2">
                                            <input
                                                defaultValue={euros(it.priceCents)}
                                                onBlur={(e) =>
                                                    updateField(it.id, {
                                                        price: Number(e.target.value.replace(",", ".")),
                                                    })
                                                }
                                            />
                                            <span className="surface-muted-text text-sm">€</span>
                                        </td>
                                        <td>
                                            <input
                                                defaultValue={it.position}
                                                type="number"
                                                onBlur={(e) => updateField(it.id, { position: Number(e.target.value) })}
                                            />
                                        </td>
                                        <td className="text-center">
                                            <input
                                                type="checkbox"
                                                defaultChecked={it.available}
                                                onChange={(e) => updateField(it.id, { available: e.target.checked })}
                                            />
                                        </td>
                                        <td className="text-right">
                                            <button onClick={() => remove(it.id)} className="btn-ghost">
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
