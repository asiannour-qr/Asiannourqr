// app/menu/page.tsx
"use client";
import { useState } from "react";
import menu from "../../data/products";

function euros(cents?: number) {
  if (typeof cents !== "number") return "";
  return `${(cents / 100).toFixed(2)} €`;
}

export default function MenuPage() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <main className="page-shell space-y-8">
      <header className="surface-card-strong px-6 py-8 text-center space-y-3">
        <span className="chip">Carte Fusion</span>
        <h1 className="text-4xl font-semibold tracking-wide">Menu Asian Nour</h1>
        <p className="surface-muted-text max-w-2xl mx-auto">
          Découvrez notre sélection de créations fusion et grands classiques. Chaque section peut être ouverte
          pour afficher les propositions et leurs tarifs.
        </p>
      </header>

      <section className="space-y-5">
        {menu.categories.map((cat) => {
          const isOpen = openCategory === cat.id;
          return (
            <article key={cat.id} className="surface-card overflow-hidden transition duration-300">
              <button
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-lg md:text-xl font-semibold">{cat.name}</span>
                  <span className="surface-muted-text text-sm">
                    {cat.items.length} {cat.items.length > 1 ? "propositions" : "proposition"}
                  </span>
                </div>
                <span
                  className={`transition-transform duration-300 text-2xl ${
                    isOpen ? "rotate-45" : ""
                  } text-[var(--color-accent-strong)]`}
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 space-y-2">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 py-3 border-b last:border-0 border-[rgba(120,110,98,0.14)]"
                    >
                      <span className="font-medium">{item.name}</span>
                      {item.price && <span className="text-sm surface-muted-text">{euros(item.price)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
