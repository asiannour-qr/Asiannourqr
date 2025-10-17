// app/page.tsx
export default function Home() {
  return (
    <main className="page-shell flex flex-col items-center">
      <div className="surface-card-strong w-full max-w-2xl px-8 py-10 text-center space-y-5">
        <span className="chip">Asian Nour</span>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-wide">
          Bienvenue chez Asian Nour
        </h1>
        <p className="text-base leading-relaxed surface-muted-text">
          Naviguez entre nos espaces&nbsp;: <b>Menu</b>, <b>Cuisine</b>, <b>QR Tables</b>. Profitez d’une
          expérience de commande raffinée et fluide, pensée pour votre équipe et vos convives.
        </p>
      </div>
    </main>
  );
}
