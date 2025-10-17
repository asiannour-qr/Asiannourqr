// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    bg: "#0B1220",
                    text: "#E5E7EB",
                    primary: "#F43F5E",
                    accent: "#FBBF24",
                    card: "#0F172A",
                    border: "#1F2937",
                },
            },
            borderRadius: {
                "2xl": "1rem",
            },
        },
    },
    plugins: [],
};
export default config;