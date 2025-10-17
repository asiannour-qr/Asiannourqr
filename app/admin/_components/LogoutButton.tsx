"use client";

export default function LogoutButton() {
    async function logout() {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
    }

    return (
        <button
            onClick={logout}
            className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-50 transition"
            title="Se déconnecter"
        >
            Déconnexion
        </button>
    );
}
