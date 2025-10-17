"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type MenuGroupDraft = {
    name: string;
    categoryFilter: string;
    minChoices: number;
    maxChoices: number;
    position: number;
};

type Menu = {
    id: string;
    name: string;
    priceCents: number;
    active: boolean;
    position: number;
    groups: {
        id: string;
        name: string;
        categoryFilter: string;
        minChoices: number;
        maxChoices: number;
        position: number;
    }[];
};

function euro(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default function AdminMenusPage() {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);

    // brouillon de création
    const [name, setName] = useState("Formule Midi");
    const [price, setPrice] = useState("13,90");
    const [position, setPosition] = useState<number>(0);
    const [active, setActive] = useState(true);
    const [groups, setGroups] = useState<MenuGroupDraft[]>([
        { name: "Entrée", categoryFilter: "Entrées", minChoices: 1, maxChoices: 1, position: 1 },
        { name: "Yakitori", categoryFilter: "Yakitoris (2 pièces)", minChoices: 1, maxChoices: 1, position: 2 },
        { name: "Plat", categoryFilter: "Plats", minChoices: 1, maxChoices: 1, position: 3 }
    ]);

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/menus", { cache: "no-store" });
            const data = await res.json();
            setMenus(data.menus ?? []);
        } catch (e: any) {
            toast.error(e?.message || "Erreur chargement menus");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function addGroup() {
        setGroups(prev => [
            ...prev,
            {
                name: `Groupe ${prev.length + 1}`,
                categoryFilter: "Entrées",
                minChoices: 1,
                maxChoices: 1,
                position: prev.length + 1
            }
        ]);
    }

    function removeGroup(idx: number) {
        setGroups(prev => prev.filter((_, i) => i !== idx));
    }

    function updateGroup<T extends keyof MenuGroupDraft>(idx: number, key: T, val: MenuGroupDraft[T]) {
        setGroups(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [key]: val };
            return copy;
        });
    }

    async function createMenu() {
        try {
            const body = {
                name: name.trim(),
                price: Number(String(price).replace(",", ".")),
                position,
                active,
                groups
            };
            const res = await fetch("/api/menus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Création échouée");
            toast.success("Menu créé !");
            setName("Formule Midi");
            setPrice("13,90");
            setPosition(0);
            setActive(true);
            setGroups([
                { name: "Entrée", categoryFilter: "Entrées", minChoices: 1, maxChoices: 1, position: 1 },
                { name: "Yakitori", categoryFilter: "Yakitoris (2 pièces)", minChoices: 1, maxChoices: 1, position: 2 },
                { name: "Plat", categoryFilter: "Plats", minChoices: 1, maxChoices: 1, position: 3 }
            ]);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Erreur création menu");
        }
    }

    async function toggleActive(menu: Menu) {
        try {
            const res = await fetch(`/api/menus/${menu.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !menu.active })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Mise à jour échouée");
            toast.success(`Menu ${!menu.active ? "activé" : "désactivé"}`);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Erreur mise à jour");
        }
    }

    async function removeMenu(id: string) {
        if (!confirm("Supprimer ce menu ?")) return;
        try {
            const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Suppression échouée");
            toast.success("Menu supprimé");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Erreur suppression");
        }
    }

    return (
        <main className="page-shell space-y-8">
            <Toaster position="top-right" />

            <header className="section-heading">
                <span className="chip">Menus composables</span>
                <h1 className="section-heading__title">Créer et orchestrer vos formules</h1>
                <p className="section-heading__subtitle">
                    Assemblez vos menus à partir des catégories existantes et définissez les règles de choix pour
                    vos convives. Chaque menu peut être activé ou désactivé à la volée.
                </p>
            </header>

            {/* Création */}
            <section className="surface-card-strong px-6 py-6 space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Créer un menu</h2>
                        <p className="surface-muted-text text-sm">
                            Définissez les informations principales puis composez les groupes d’options.
                        </p>
                    </div>
                    <button onClick={createMenu} className="btn-primary">
                        Créer le menu
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    <input
                        placeholder="Nom du menu"
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
                        type="number"
                        placeholder="Position"
                        value={position}
                        onChange={(e) => setPosition(Number(e.target.value))}
                    />
                    <label className="flex items-center gap-2 text-sm font-medium surface-muted-text">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
                            className="w-4 h-4"
                        />
                        Actif
                    </label>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Groupes d’options</h3>
                        <button onClick={addGroup} className="btn-soft">
                            + Ajouter un groupe
                        </button>
                    </div>

                    <div className="space-y-3">
                        {groups.map((g, i) => (
                            <div key={i} className="surface-panel px-4 py-4 grid gap-3 md:grid-cols-6 items-end">
                                <input
                                    placeholder="Nom du groupe"
                                    value={g.name}
                                    onChange={(e) => updateGroup(i, "name", e.target.value)}
                                    className="md:col-span-2"
                                />
                                <input
                                    placeholder='Catégorie (ex: "Entrées")'
                                    value={g.categoryFilter}
                                    onChange={(e) => updateGroup(i, "categoryFilter", e.target.value)}
                                    className="md:col-span-2"
                                />
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={g.minChoices}
                                    onChange={(e) => updateGroup(i, "minChoices", Number(e.target.value))}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={g.maxChoices}
                                    onChange={(e) => updateGroup(i, "maxChoices", Number(e.target.value))}
                                />
                                <input
                                    type="number"
                                    placeholder="Position"
                                    value={g.position}
                                    onChange={(e) => updateGroup(i, "position", Number(e.target.value))}
                                />
                                <div className="flex justify-end md:col-span-1">
                                    <button onClick={() => removeGroup(i)} className="btn-ghost">
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Liste */}
            <section className="surface-card px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Menus existants</h2>
                    <span className="surface-muted-text text-sm">
                        {loading ? "Chargement…" : `${menus.length} menu(s) configuré(s)`}
                    </span>
                </div>

                {loading ? (
                    <div className="surface-muted-text">Chargement…</div>
                ) : menus.length === 0 ? (
                    <div className="surface-muted-text">Aucun menu pour le moment.</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {menus.map((m) => (
                            <article key={m.id} className="surface-panel px-5 py-5 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {m.name} • <span className="surface-muted-text">{euro(m.priceCents)}</span>
                                        </h3>
                                        <p className="text-xs uppercase tracking-[0.32em] surface-muted-text">
                                            Position {m.position} · {m.active ? "Actif" : "Inactif"}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => toggleActive(m)} className="btn-soft">
                                            {m.active ? "Mettre en pause" : "Activer"}
                                        </button>
                                        <button onClick={() => removeMenu(m.id)} className="btn-ghost">
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                                {m.groups?.length > 0 && (
                                    <ul className="space-y-1 text-sm">
                                        {m.groups.map((g) => (
                                            <li key={g.id} className="surface-muted-text">
                                                • <span className="font-medium text-[var(--color-heading)]">{g.name}</span>{" "}
                                                — {g.categoryFilter} (min {g.minChoices}, max {g.maxChoices})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
