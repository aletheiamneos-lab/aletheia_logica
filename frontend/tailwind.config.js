/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f3f6fa",
        ink: "#1f2937",
        accent: "#335f91",
        accentSoft: "#edf3fb",
        panelLine: "#d7dee8",
        panelSoft: "#eef2f7",
        sand: "#e7edf5",
        sun: "#b9c7da",
      },
      fontFamily: {
        body: ["var(--font-editorial)"],
        display: ["var(--font-editorial)"],
        ui: ["var(--font-ui-premium)"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(38, 87, 166, 0.08)",
        lift: "0 12px 26px rgba(38, 87, 166, 0.1)",
      },
    },
  },
  plugins: [],
}
