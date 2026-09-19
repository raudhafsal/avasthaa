import type { Config } from "tailwindcss";

/**
 * Avas Thaa design tokens
 * — Deep ocean blue + lagoon turquoise on clean white, per brand brief.
 * — Coral used sparingly for primary actions/badges (not decoration).
 * — Dhivehi (Thaana) and English share a type scale; Thaana needs its own
 *   face since Latin fonts don't cover the script.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#eef5fb",
          100: "#d7e8f4",
          200: "#a9cde7",
          300: "#72add8",
          400: "#3d84c2",
          500: "#1f66a3",
          600: "#155083",
          700: "#123f68",
          800: "#0f3252",
          900: "#0a2038", // primary deep ocean
          950: "#061424",
        },
        lagoon: {
          50: "#e9fbf8",
          100: "#c8f5ec",
          200: "#93ecdb",
          300: "#5cdcc6",
          400: "#2fc3ac",
          500: "#17a38c", // primary turquoise
          600: "#118272",
          700: "#11675c",
          800: "#12524a",
          900: "#12443e",
        },
        coral: {
          50: "#fff1ee",
          100: "#ffe0d9",
          200: "#ffbcac",
          300: "#ff9077",
          400: "#ff6a49",
          500: "#f2492a", // action accent, used sparingly
          600: "#d1381d",
          700: "#ac2c17",
        },
        sand: {
          50: "#ffffff",
          100: "#fbfaf7",
          200: "#f4f1ea",
        },
        ink: {
          900: "#0f1b22",
          700: "#33454e",
          500: "#5b6b73",
          300: "#94a3aa",
        },
      },
      fontFamily: {
        latin: ["var(--font-latin)", "system-ui", "sans-serif"],
        thaana: ["var(--font-thaana)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,27,34,0.04), 0 8px 24px rgba(15,27,34,0.06)",
      },
      spacing: {
        "touch": "2.75rem", // 44px minimum touch target
      },
    },
  },
  plugins: [],
};

export default config;
