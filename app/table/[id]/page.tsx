// app/table/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

type MenuItem = {
    id: string;
    name: string;
    priceCents: number;
    category: string;
    position: number;
    description?: string | null;
};
type CartLine = { id: string; name: string; priceCents: number; qty: number; personId: string };
type MenuGroup = { id: string; name: string; categoryFilter: string; minChoices: number; maxChoices: number; position: number };
type MenuDef = { id: string; name: string; priceCents: number; groups?: MenuGroup[] };
type ComposeStep = {
    group: MenuGroup;
    options: MenuItem[];
    includeCategory: boolean;
    minChoices: number;
    maxChoices: number;
    multi: boolean;
    xorKey?: string | null;
    displayCategory: string;
};
type ComposeState = {
    menu: MenuDef;
    steps: ComposeStep[];
    selectionMap: Record<string, string[]>;
};

function euro(cents: number) {
    return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

// 🔹 alias tolérés pour rattraper Starter/Silver/Gold
const CAT_ALIASES: Record<string, string | string[]> = {
    "Starter": "Plats Starter",
    "Silver": "Plats Silver",
    "Gold": "Plats Gold",
    "starter": "Plats Starter",
    "silver": "Plats Silver",
    "gold": "Plats Gold",
    "Entrée / Yakitoris": ["Entrées", "Yakitoris (2 pièces)"],
    "Entrée/Yakitoris": ["Entrées", "Yakitoris (2 pièces)"],
    "Entrée ou Yakitoris": ["Entrées", "Yakitoris (2 pièces)"],
    "Entrée": "Entrées",
    "entrée": "Entrées",
    "Yakitoris": "Yakitoris (2 pièces)",
    "Entrée (2 pièces)": "Entrées",
    "Accompagnement": "Accompagnements",
    "Goûter": "Desserts",
};

const HIDDEN_MENU_CATEGORIES = new Set(["Boissons Kid", "Desserts Kid"]);

export default function TablePage() {
    // ⚠️ dossier = app/table/[id] : le param s’appelle "id"
    const params = useParams<{ id: string }>();
    const tableId = params?.id ?? "1";

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [menus, setMenus] = useState<MenuDef[]>([]);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState<CartLine[]>([]);
    const [comment, setComment] = useState("");
    const [peopleCount, setPeopleCount] = useState<number>(1);
    const [composeState, setComposeState] = useState<ComposeState | null>(null);
    const [composeErrors, setComposeErrors] = useState<Record<string, string>>({});
    const [activePerson, setActivePerson] = useState<string>("P1");
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [expandedPersons, setExpandedPersons] = useState<Set<string>>(() => new Set());

    async function loadAll() {
        setLoading(true);
        try {
            const [itRes, mRes] = await Promise.all([
                fetch("/api/menu", { cache: "no-store" }),
                fetch("/api/menus", { cache: "no-store" }),
            ]);
            const it = await itRes.json();
            const m = await mRes.json();
            const rawItems: MenuItem[] = Array.isArray(it.items) ? it.items : [];
            const sanitizedItems = rawItems.filter(
                (item) => !(item?.category === "Boissons" && /1L/i.test(item?.name ?? ""))
            );
            setMenuItems(sanitizedItems);
            setMenus(Array.isArray(m.menus) ? m.menus : []);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || "Erreur chargement");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(`table:${tableId}:people`);
        const n = Number(stored);
        if (Number.isFinite(n) && n >= 1 && n <= 12) {
            setPeopleCount(Math.round(n));
        }
    }, [tableId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(`table:${tableId}:people`, String(peopleCount));
    }, [peopleCount, tableId]);

    useEffect(() => {
        if (!cartDrawerOpen) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeCartDrawer();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [cartDrawerOpen]);

    useEffect(() => {
        if (cartDrawerOpen && cart.length === 0) {
            setCartDrawerOpen(false);
        }
    }, [cartDrawerOpen, cart.length]);

    const personIds = useMemo(
        () => Array.from({ length: Math.max(1, peopleCount) }, (_, i) => `P${i + 1}`),
        [peopleCount]
    );

    useEffect(() => {
        setExpandedPersons((prev) => {
            const next = new Set(Array.from(prev).filter((pid) => personIds.includes(pid)));
            return next.size === prev.size ? prev : next;
        });
    }, [personIds]);

    useEffect(() => {
        setCart((prev) => {
            if (!prev.length) return prev;
            const allowed = new Set(personIds);
            const fallback = personIds[personIds.length - 1] || "P1";
            let changed = false;
            const next = prev.map((line) => {
                if (allowed.has(line.personId)) return line;
                changed = true;
                return { ...line, personId: fallback };
            });
            return changed ? next : prev;
        });
        setActivePerson((prev) => {
            const index = parseInt(prev.slice(1) || "1", 10);
            if (!Number.isFinite(index) || index < 1 || index > peopleCount) {
                return personIds[0] || "P1";
            }
            return prev;
        });
    }, [peopleCount, personIds]);

    const categoryOrder = useMemo(() => {
        const order = new Map<string, number>();
        let index = 0;
        for (const it of menuItems) {
            const key = (it?.category || "").trim();
            if (!key) continue;
            if (!order.has(key)) {
                order.set(key, index++);
            }
        }
        return order;
    }, [menuItems]);

    const itemsByCategory = useMemo(() => {
        const map = new Map<string, MenuItem[]>();
        for (const it of menuItems) {
            const key = (it?.category || "").trim();
            if (!key) continue;
            const arr = map.get(key) ?? [];
            arr.push(it);
            map.set(key, arr);
        }
        for (const [k, arr] of map) {
            arr.sort((a, b) => {
                if (a.position !== b.position) return a.position - b.position;
                return a.name.localeCompare(b.name, "fr");
            });
        }
        return map;
    }, [menuItems]);

    const menuItemMap = useMemo(() => {
        const map = new Map<string, MenuItem>();
        for (const it of menuItems) {
            map.set(it.id, it);
        }
        return map;
    }, [menuItems]);

    // ajout : support des filtres multiples (A|B|C) pour les menus chauds
    function resolveCategoryTokens(raw: string, seen = new Set<string>()): string[] {
        const tokens = raw
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
        const queue = tokens.length ? tokens : [raw.trim()];
        const result = new Set<string>();

        const pushToken = (token: string) => {
            if (!token) return;
            const normalized = token.trim();
            if (!normalized) return;
            if (seen.has(normalized.toLowerCase())) return;
            seen.add(normalized.toLowerCase());

            const alias =
                CAT_ALIASES[normalized] ??
                CAT_ALIASES[normalized.toLowerCase()] ??
                CAT_ALIASES[normalized.replace(/\s+/g, " ")] ??
                CAT_ALIASES[normalized.replace(/\s+/g, " ").toLowerCase()];

            if (Array.isArray(alias)) {
                alias.forEach((next) => pushToken(next));
            } else if (typeof alias === "string") {
                pushToken(alias);
            } else {
                result.add(normalized);
            }
        };

        queue.forEach((token) => pushToken(token));
        return Array.from(result);
    }

    function findListByCategory(cat: string): MenuItem[] {
        const categories = resolveCategoryTokens(cat);
        if (!categories.length) return [];

        const collected: MenuItem[] = [];
        for (const key of categories) {
            const arr = itemsByCategory.get(key);
            if (arr?.length) collected.push(...arr);
        }

        collected.sort((a, b) => {
            const orderA = categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER;
            const orderB = categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) return orderA - orderB;
            if (a.position !== b.position) return a.position - b.position;
            return a.name.localeCompare(b.name, "fr");
        });

        return collected;
    }

    function parseCategoryFilter(raw: string) {
        const parts = raw.split("::").map((s) => s.trim()).filter(Boolean);
        const filter = parts.shift() ?? "";
        const meta: Record<string, string> = {};
        for (const part of parts) {
            const [k, v] = part.split("=").map((s) => s.trim());
            if (k && v) meta[k.toLowerCase()] = v;
        }
        return { filter, meta };
    }

    function filterOptionsForGroup(menuName: string, group: MenuGroup, rawFilter: string, options: MenuItem[]): MenuItem[] {
        if (menuName === "Asian Kid’s" && group.name.toLowerCase().includes("accompagnement")) {
            const allowedKeywords = ["riz nature", "nouilles sautées légumes", "riz cantonnais"];
            return options.filter((opt) => {
                const label = opt.name.toLowerCase();
                return allowedKeywords.some((kw) => label.includes(kw));
            });
        }
        if (rawFilter === "Desserts Kid") {
            return options.filter((opt) => opt.name.toLowerCase().includes("compote"));
        }
        if (rawFilter === "Boissons Kid") {
            return options.filter((opt) => opt.name.toLowerCase().includes("capri"));
        }
        return options;
    }

    function adjustPeople(delta: number) {
        setPeopleCount((prev) => {
            const next = Math.max(1, Math.min(12, prev + delta));
            return next;
        });
    }

    function addToCartLine(name: string, priceCents: number, personId?: string) {
        const target = personId || activePerson || "P1";
        const key = `${name}|${priceCents}`;
        setCart((prev) => {
            const i = prev.findIndex((l) => l.id === key && l.personId === target);
            if (i >= 0) {
                const copy = [...prev];
                copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
                return copy;
            }
            return [...prev, { id: key, name, priceCents, qty: 1, personId: target }];
        });
    }

    function decFromCart(id: string, personId: string) {
        setCart((prev) => {
            const i = prev.findIndex((l) => l.id === id && l.personId === personId);
            if (i === -1) return prev;
            const copy = [...prev];
            const q = copy[i].qty - 1;
            if (q <= 0) copy.splice(i, 1);
            else copy[i] = { ...copy[i], qty: q };
            return copy;
        });
    }

    function removeLineFromCart(id: string, personId: string) {
        setCart((prev) => prev.filter((line) => !(line.id === id && line.personId === personId)));
    }

    function clearPersonCart(personId: string) {
        setCart((prev) => prev.filter((line) => line.personId !== personId));
    }

    function clearEntireCart() {
        setCart([]);
        setComment("");
        setCartDrawerOpen(false);
        setExpandedPersons(new Set());
    }

    // --- Composition menu avec contraintes (XOR, min/max) ---
    function composeMenu(menu: MenuDef) {
        try {
            if (!menu || !Array.isArray(menu.groups) || menu.groups.length === 0) {
                toast.error("Ce menu n’a pas de groupes. Va dans Admin > Menus.");
                return;
            }

            const sorted = [...menu.groups].sort((a, b) => a.position - b.position);
            const steps: ComposeStep[] = sorted.map((group) => {
                const { filter, meta } = parseCategoryFilter(group.categoryFilter);
                const minRaw = Number.isFinite(group.minChoices) ? Number(group.minChoices) : 1;
                const maxRaw = Number.isFinite(group.maxChoices) ? Number(group.maxChoices) : minRaw;
                const minChoices = Math.max(0, minRaw);
                const maxChoices = Math.max(minChoices || 0, maxRaw);

                const baseOptions = findListByCategory(filter);
                const options = filterOptionsForGroup(menu.name, group, filter, baseOptions)
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

                const includeCategory = new Set(options.map((it) => it.category)).size > 1;
                const multi = maxChoices > 1;

                return {
                    group,
                    options,
                    includeCategory,
                    minChoices,
                    maxChoices,
                    multi,
                    xorKey: meta.xor ?? null,
                    displayCategory: filter || group.categoryFilter,
                };
            });

            const blocking = steps.find((step) => step.options.length === 0 && !step.xorKey && step.minChoices > 0);
            if (blocking) {
                toast.error(`Aucun plat trouvé dans « ${blocking.displayCategory || blocking.group.categoryFilter} ». Mets à jour la carte ou les alias.`);
                return;
            }

            const selectionMap: Record<string, string[]> = {};
            for (const step of steps) {
                if (!step.xorKey && step.options.length === 1 && step.maxChoices >= 1) {
                    selectionMap[step.group.id] = [step.options[0].id];
                } else {
                    selectionMap[step.group.id] = [];
                }
            }

            setComposeState({ menu, steps, selectionMap });
            setComposeErrors(collectErrors(steps, selectionMap));
        } catch (e: any) {
            console.error("composeMenu error:", e);
            toast.error(e?.message || "Erreur pendant la composition du menu");
        }
    }

    function cancelCompose() {
        setComposeState(null);
        setComposeErrors({});
    }

    function setSelection(step: ComposeStep, values: string[]) {
        if (!composeState) return;
        const nextMap: Record<string, string[]> = { ...composeState.selectionMap, [step.group.id]: values };

        if (step.xorKey && values.length > 0) {
            for (const other of composeState.steps) {
                if (other.group.id !== step.group.id && other.xorKey === step.xorKey) {
                    nextMap[other.group.id] = [];
                }
            }
        }

        setComposeState({ ...composeState, selectionMap: nextMap });
        setComposeErrors(collectErrors(composeState.steps, nextMap));
    }

    function handleSingleSelect(step: ComposeStep, value: string | null) {
        setSelection(step, value ? [value] : []);
    }

    function handleCheckboxToggle(step: ComposeStep, value: string) {
        if (!composeState) return;
        const current = composeState.selectionMap[step.group.id] ?? [];
        const exists = current.includes(value);
        let next = exists ? current.filter((v) => v !== value) : [...current, value];
        if (!exists && next.length > step.maxChoices) {
            toast.error(`Sélection maximale : ${step.maxChoices} option(s).`);
            return;
        }
        setSelection(step, next);
    }

    function requirementText(step: ComposeStep) {
        if (step.xorKey) {
            return "Choisissez UNE entrée OU UNE paire de yakitoris.";
        }
        if (step.minChoices === step.maxChoices) {
            return `Choisissez ${step.minChoices} option(s).`;
        }
        return `Choisissez entre ${step.minChoices} et ${step.maxChoices} option(s).`;
    }

    function collectErrors(steps: ComposeStep[], selectionMap: Record<string, string[]>): Record<string, string> {
        const errors: Record<string, string> = {};
        const xorTotals = new Map<string, number>();

        for (const step of steps) {
            if (!step.xorKey) continue;
            const current = selectionMap[step.group.id] ?? [];
            xorTotals.set(step.xorKey, (xorTotals.get(step.xorKey) ?? 0) + current.length);
        }

        for (const step of steps) {
            const selectedCount = selectionMap[step.group.id]?.length ?? 0;
            const min = step.xorKey ? 0 : step.minChoices;
            if (selectedCount < min) {
                if (step.minChoices === step.maxChoices) {
                    errors[step.group.id] = `Sélectionnez ${step.minChoices} option(s).`;
                } else {
                    errors[step.group.id] = `Sélectionnez au moins ${step.minChoices} option(s).`;
                }
            } else if (selectedCount > step.maxChoices) {
                errors[step.group.id] = `Sélectionnez au maximum ${step.maxChoices} option(s).`;
            }
        }

        for (const [key, total] of xorTotals) {
            const related = steps.filter((s) => s.xorKey === key);
            if (total === 0) {
                for (const step of related) {
                    errors[step.group.id] = "Choisissez UNE entrée OU UNE paire de yakitoris.";
                }
            } else if (total > 1) {
                for (const step of related) {
                    errors[step.group.id] = "Sélectionnez une seule option pour cette étape.";
                }
            }
        }

        return errors;
    }

    function finalizeMenuSelections(menu: MenuDef, steps: ComposeStep[], selectionMap: Record<string, string[]>) {
        const detailParts: string[] = [];
        for (const step of steps) {
            const selectedIds = selectionMap[step.group.id] ?? [];
            const items = selectedIds
                .map((id) => menuItemMap.get(id))
                .filter((it): it is MenuItem => Boolean(it));
            if (!items.length) continue;
            const names = items
                .map((it) => (step.includeCategory ? `${it.name} — ${it.category}` : it.name))
                .join(step.multi ? " + " : ", ");
            detailParts.push(`${step.group.name}: ${names}`);
        }
        const label = detailParts.length > 0 ? `${menu.name} — ${detailParts.join(" • ")}` : menu.name;
        addToCartLine(label, menu.priceCents, activePerson);
        toast.success(`Menu ajouté pour ${activePerson}`);
        setComposeState(null);
        setComposeErrors({});
    }

    function confirmCompose() {
        if (!composeState) return;
        const errors = collectErrors(composeState.steps, composeState.selectionMap);
        setComposeErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error("Complétez les choix du menu avant de valider.");
            return;
        }
        finalizeMenuSelections(composeState.menu, composeState.steps, composeState.selectionMap);
    }

    function openCartDrawer() {
        setExpandedPersons(new Set());
        setCartDrawerOpen(true);
    }

    function closeCartDrawer() {
        setCartDrawerOpen(false);
    }

    function togglePersonPanel(personId: string) {
        setExpandedPersons((prev) => {
            const next = new Set(prev);
            if (next.has(personId)) next.delete(personId);
            else next.add(personId);
            return next;
        });
    }

    const totalCents = cart.reduce((s, l) => s + l.priceCents * l.qty, 0);
    const cartByPerson = useMemo(() => {
        const map = new Map<string, CartLine[]>();
        for (const pid of personIds) map.set(pid, []);
        for (const line of cart) {
            const pid = personIds.includes(line.personId) ? line.personId : personIds[0] || "P1";
            if (!map.has(pid)) map.set(pid, []);
            map.get(pid)!.push(line);
        }
        for (const [, arr] of map) {
            arr.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        }
        return map;
    }, [cart, personIds]);
    const cartItemCount = cart.reduce((s, l) => s + l.qty, 0);
    const hasCartItems = cartItemCount > 0;

    // --- ENVOI COMMANDE : version avec logs détaillés si 400
    async function submitOrder() {
        if (cart.length === 0) return toast.error("Panier vide");
        try {
            const payload = {
                tableId: String(tableId),
                total: totalCents,
                comment: comment.trim() || null,
                peopleCount: Math.max(1, Math.min(12, Number(peopleCount) || 1)),
                items: cart.map((l) => ({ name: String(l.name), qty: Number(l.qty) })),
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const text = await res.text();
            let data: any = {};
            try { data = JSON.parse(text); } catch { /* texte brut */ }

            if (!res.ok) {
                console.error("POST /api/orders", res.status, data || text);
                toast.error(data?.message || `Commande refusée (${res.status})`);
                return;
            }

            toast.success("Commande envoyée !");
            setCartDrawerOpen(false);
            setExpandedPersons(new Set());
            setCart([]);
            setComment("");
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || "Erreur d’envoi");
        }
    }

    return (
        <>
        <main className="page-shell space-y-8">
            <Toaster position="top-right" />

            <header className="surface-card-strong px-6 py-6 space-y-2">
                <span className="chip">Commande en cours</span>
                <h1 className="text-3xl font-semibold">Asian Nour — Table {tableId}</h1>
                <p className="surface-muted-text text-sm">
                    Composez votre menu ou sélectionnez vos plats à la carte. Les commandes sont envoyées
                    directement en cuisine.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.2em] surface-muted-text">
                            Convives
                        </span>
                        <button
                            className="btn-ghost px-3 py-1"
                            onClick={() => adjustPeople(-1)}
                            title="Réduire le nombre de convives"
                        >
                            −
                        </button>
                        <span className="px-3 py-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] font-semibold">
                            {peopleCount}
                        </span>
                        <button
                            className="btn-ghost px-3 py-1"
                            onClick={() => adjustPeople(1)}
                            title="Augmenter le nombre de convives"
                        >
                            +
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {personIds.map((pid) => {
                            const isActive = pid === activePerson;
                            return (
                                <button
                                    key={pid}
                                    className={`px-3 py-1 rounded-full border transition ${
                                        isActive
                                            ? "border-transparent bg-[var(--color-accent)] text-white"
                                            : "border-[var(--color-border)] bg-[var(--color-surface-strong)]"
                                    }`}
                                    onClick={() => setActivePerson(pid)}
                                >
                                    {pid}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Mini cart bar */}
            <div className="sticky top-0 z-40">
                <div className="surface-card-strong border border-[var(--color-border)] shadow-sm px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm sm:text-base font-semibold">
                        Panier — {cartItemCount} article(s) — {euro(totalCents)}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="btn-ghost"
                            onClick={clearEntireCart}
                            disabled={!hasCartItems}
                        >
                            Vider
                        </button>
                        <button
                            className="btn-primary"
                            onClick={openCartDrawer}
                            disabled={!hasCartItems}
                        >
                            Ouvrir
                        </button>
                    </div>
                </div>
            </div>

            {/* À la carte */}
            <section className="space-y-5">
                <div className="section-heading mb-0">
                    <h2 className="section-heading__title text-2xl">À la carte</h2>
                    <p className="section-heading__subtitle">
                        Parcourez la carte et ajoutez librement vos envies au panier de la table.
                    </p>
                </div>

                {loading ? (
                    <div className="surface-muted-text">Chargement…</div>
                ) : (
                    <>
                        {menus.length > 0 && (
                            <article className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold">Menus chauds à composer</h3>
                                    <span className="text-xs uppercase tracking-[0.18em] surface-muted-text">Formules guidées</span>
                                </div>
                                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {menus.map((m) => (
                                        <div key={m.id} className="surface-card px-5 py-5 rounded-2xl flex flex-col gap-3">
                                            <div>
                                                <div className="text-lg font-semibold">{m.name}</div>
                                                <div className="surface-muted-text text-sm">{euro(m.priceCents)}</div>
                                            </div>
                                            <button className="btn-primary" onClick={() => composeMenu(m)}>
                                                Composer pour {activePerson}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        )}

                        {Array.from(itemsByCategory.entries())
                            .filter(([cat]) => !HIDDEN_MENU_CATEGORIES.has(cat))
                            .map(([cat, list]) => {
                                const title = cat === "Boxes" ? "Nos BOX" : cat;
                                return (
                                    <article key={cat} className="space-y-3">
                                        <h3 className="text-xl font-semibold">{title}</h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {list.map((it) => (
                                                <div key={it.id} className="surface-card px-5 py-4 flex items-center justify-between gap-4">
                                                    <div>
                                                        <div className="font-medium">{it.name}</div>
                                                        <div className="surface-muted-text text-sm">{euro(it.priceCents)}</div>
                                                        {it.description ? (
                                                            <p className="text-xs surface-muted-text mt-1 max-w-xs">{it.description}</p>
                                                        ) : null}
                                                    </div>
                                                    <button className="btn-soft" onClick={() => addToCartLine(it.name, it.priceCents)}>
                                                        Ajouter à {activePerson}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                );
                            })}
                    </>
                )}
            </section>

            {hasCartItems && !cartDrawerOpen && (
                <button
                    className="sm:hidden fixed bottom-5 right-5 z-50 rounded-full bg-[var(--color-accent)] text-white px-4 py-3 shadow-elevated flex items-center gap-2"
                    onClick={openCartDrawer}
                >
                    <span className="font-semibold">Panier</span>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--color-accent)] text-xs font-bold">
                        {cartItemCount}
                    </span>
                </button>
            )}
        </main>

        {composeState && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="surface-card w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-elevated">
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold">Composer {composeState.menu.name}</h3>
                        <span className="text-sm surface-muted-text">Total menu&nbsp;: {euro(composeState.menu.priceCents)}</span>
                    </div>

                    {(() => {
                        const summary = composeState.steps
                            .map((step) => {
                                const selectedIds = composeState.selectionMap[step.group.id] ?? [];
                                const items = selectedIds
                                    .map((id) => menuItemMap.get(id))
                                    .filter((it): it is MenuItem => Boolean(it));
                                if (!items.length) return null;
                                return {
                                    id: step.group.id,
                                    name: step.group.name,
                                    value: items.map((it) => it.name).join(step.multi ? " + " : ", "),
                                };
                            })
                            .filter(Boolean) as { id: string; name: string; value: string }[];
                        if (!summary.length) return null;
                        return (
                            <div className="surface-panel border border-[rgba(120,110,98,0.18)] rounded-xl px-4 py-3 text-sm space-y-1">
                                {summary.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="surface-muted-text">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {composeState.steps.map((step) => {
                            const selectedIds = composeState.selectionMap[step.group.id] ?? [];
                            const instruction = requirementText(step);
                            const error = composeErrors[step.group.id];

                            return (
                                <section
                                    key={step.group.id}
                                    className={`rounded-xl border px-4 py-3 space-y-2 ${
                                        error ? "border-red-400 bg-red-50/60" : "border-[var(--color-border)] bg-[var(--color-surface)]"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="font-medium">{step.group.name}</div>
                                        <span className="text-xs surface-muted-text uppercase tracking-[0.18em]">
                                            {step.displayCategory || step.group.categoryFilter}
                                        </span>
                                    </div>
                                    {step.xorKey && (
                                        <p className="text-xs font-medium text-amber-600">
                                            Choisissez UNE entrée OU UNE paire de yakitoris.
                                        </p>
                                    )}

                                    {step.options.length === 0 ? (
                                        <div className="text-xs surface-muted-text">
                                            Aucun plat trouvé pour cette étape. Contactez le serveur.
                                        </div>
                                    ) : step.multi ? (
                                        <div className="space-y-2">
                                            {step.options.map((opt) => {
                                                const checked = selectedIds.includes(opt.id);
                                                return (
                                                    <label
                                                        key={opt.id}
                                                        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => handleCheckboxToggle(step, opt.id)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="flex-1">
                                                            {step.includeCategory
                                                                ? `${opt.name} — ${opt.category}`
                                                                : opt.name}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedIds[0] ?? ""}
                                            onChange={(e) => handleSingleSelect(step, e.target.value || null)}
                                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                                        >
                                            <option value="">— Sélectionner —</option>
                                            {step.options.map((opt) => (
                                                <option key={opt.id} value={opt.id}>
                                                    {step.includeCategory ? `${opt.name} — ${opt.category}` : opt.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <p className="text-xs surface-muted-text">{instruction}</p>
                                    {error && <p className="text-xs text-red-600">{error}</p>}
                                </section>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-sm surface-muted-text">
                            Ajouté pour <span className="font-semibold">{activePerson}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="btn-ghost" onClick={cancelCompose}>
                                Annuler
                            </button>
                            <button
                                className="btn-primary"
                                onClick={confirmCompose}
                                disabled={Object.keys(composeErrors).length > 0}
                            >
                                Ajouter ({euro(composeState.menu.priceCents)})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {cartDrawerOpen && (
            <div className="fixed inset-0 z-40 flex">
                <div className="absolute inset-0 bg-black/40" onClick={closeCartDrawer} />
                <aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] shadow-elevated">
                    <header className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold">Mon panier</div>
                            <div className="text-xs surface-muted-text">{cartItemCount} article(s) — {euro(totalCents)}</div>
                        </div>
                        <button className="btn-ghost" onClick={closeCartDrawer}>
                            Fermer
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="cart-comment">
                                Commentaire (optionnel)
                            </label>
                            <textarea
                                id="cart-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm"
                                placeholder="Allergies, cuisson, etc."
                            />
                        </div>

                        {personIds.map((pid) => {
                            const lines = cartByPerson.get(pid) ?? [];
                            const subtotal = lines.reduce((s, l) => s + l.priceCents * l.qty, 0);
                            const count = lines.reduce((s, l) => s + l.qty, 0);
                            const expanded = expandedPersons.has(pid);
                            return (
                                <div key={pid} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]">
                                    <button
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                                        onClick={() => togglePersonPanel(pid)}
                                    >
                                        <div>
                                            <div className="font-semibold">{pid}</div>
                                            <div className="text-xs surface-muted-text">
                                                {count} article(s) — {euro(subtotal)}
                                            </div>
                                        </div>
                                        <span className="text-lg font-semibold">
                                            {expanded ? "−" : "+"}
                                        </span>
                                    </button>
                                    {expanded && (
                                        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-3">
                                            <div className="flex items-center justify-between text-xs surface-muted-text">
                                                <span>
                                                    Sous-total&nbsp;{euro(subtotal)}
                                                </span>
                                                <button
                                                    className="btn-ghost text-xs"
                                                    onClick={() => clearPersonCart(pid)}
                                                    disabled={lines.length === 0}
                                                >
                                                    Vider {pid}
                                                </button>
                                            </div>
                                            {lines.length === 0 ? (
                                                <div className="text-sm surface-muted-text">Aucun plat pour {pid}.</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {lines.map((line) => (
                                                        <div
                                                            key={`${line.personId}:${line.id}`}
                                                            className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm leading-snug">{line.name}</div>
                                                                <div className="text-xs surface-muted-text">{euro(line.priceCents)}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="px-2 py-1 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-accent-soft)] transition"
                                                                    onClick={() => decFromCart(line.id, line.personId)}
                                                                    title="Retirer"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-semibold">{line.qty}</span>
                                                                <button
                                                                    className="px-2 py-1 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-accent-soft)] transition"
                                                                    onClick={() => addToCartLine(line.name, line.priceCents, line.personId)}
                                                                    title="Ajouter"
                                                                >
                                                                    +
                                                                </button>
                                                                <button
                                                                    className="px-2 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition"
                                                                    onClick={() => removeLineFromCart(line.id, line.personId)}
                                                                    title="Supprimer"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <footer className="px-6 py-4 border-t border-[var(--color-border)] space-y-3">
                        <div className="flex items-center justify-between font-semibold">
                            <span>Total</span>
                            <span>{euro(totalCents)}</span>
                        </div>
                        <button className="btn-primary w-full" onClick={submitOrder} disabled={!hasCartItems}>
                            Envoyer la commande
                        </button>
                    </footer>
                </aside>
            </div>
        )}
        </>
    );
}
