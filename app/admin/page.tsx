// app/admin/page.tsx
export default function AdminHome() {
    return (
        <main className="page-shell max-w-3xl">
            <section className="surface-card-strong px-8 py-10 space-y-6">
                <div className="section-heading">
                    <span className="chip">Administration</span>
                    <h1 className="section-heading__title">Espace gestion</h1>
                    <p className="section-heading__subtitle">
                        Retrouvez l’ensemble des outils pour générer les supports QR et piloter votre carte.
                    </p>
                </div>

                <ul className="grid gap-4 sm:grid-cols-2">
                    <li>
                        <a href="/admin/qrs" className="btn-primary w-full justify-center">
                            Générer QR (A4)
                        </a>
                    </li>
                    <li>
                        <a href="/admin/qrs/badges" className="btn-primary w-full justify-center">
                            Badges coin de table
                        </a>
                    </li>
                </ul>
            </section>
        </main>
    );
}
