// app/admin/qrs/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type QR = { table: number; dataUrl: string };

export default function AdminQRCodesPage() {
    const [count, setCount] = useState(20);
    const [busy, setBusy] = useState(false);
    const [codes, setCodes] = useState<QR[]>([]);

    // force le port 3001
    const baseUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        const origin = window.location.origin;
        return origin.replace(/:\d+$/, ":3001");
    }, []);

    async function generate() {
        if (!baseUrl) return;
        setBusy(true);
        try {
            const arr: QR[] = [];
            for (let i = 1; i <= count; i++) {
                const url = `${baseUrl}/table/${i}`;
                const dataUrl = await QRCode.toDataURL(url, {
                    errorCorrectionLevel: "M",
                    margin: 1,
                    scale: 8,
                });
                arr.push({ table: i, dataUrl });
            }
            setCodes(arr);
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        generate();
    }, [baseUrl]); // ok

    return (
        <main className="page-shell space-y-8">
            <header className="surface-card-strong px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <span className="chip">QR Codes A4</span>
                    <h1 className="text-3xl font-semibold">Tables prêtes à l’impression</h1>
                    <p className="surface-muted-text text-sm max-w-xl">
                        Générez vos QR Codes en fonction du nombre de tables, puis imprimez-les pour les disposer
                        sur vos supports A4.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm flex items-center gap-3 font-medium surface-muted-text">
                        Nombre de tables
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value || "1", 10))}
                            className="w-24"
                        />
                    </label>
                    <button onClick={generate} disabled={busy} className="btn-ghost">
                        {busy ? "Génération…" : "Régénérer"}
                    </button>
                    <button onClick={() => window.print()} className="btn-primary">
                        Imprimer
                    </button>
                </div>
            </header>

            {codes.length === 0 ? (
                <p className="surface-muted-text">Pas encore de QR…</p>
            ) : (
                <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid print:grid-cols-3">
                    {codes.map((q) => (
                        <article
                            key={q.table}
                            className="surface-card px-5 py-6 flex flex-col items-center gap-4 print:break-inside-avoid"
                        >
                            <img src={q.dataUrl} alt={`Table ${q.table}`} className="w-44 h-44" />
                            <div className="text-center space-y-1">
                                <div className="text-sm surface-muted-text tracking-[0.3em] uppercase">
                                    Scannez pour commander
                                </div>
                                <div className="text-2xl font-semibold">Table {q.table}</div>
                                <div className="text-xs surface-muted-text mt-1 font-mono">
                                    {baseUrl.replace(/^https?:\/\//, "")}/table/{q.table}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}
