import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        canvas: {
          base: "#F4F4F6",
          paper: "#FCFCFB",
          white: "#FFFFFF",
          border: "#E8E8ED",
          hairline: "#EFEFF1",
          text: "#1D1D1F",
          muted: "#6E6E73",
          subtle: "#AEAEB2",
          brand: "#8B3DFF",
          brandHover: "#7A2EF0",
          brandLight: "#F3EBFF",
          mint: "#00C4CC",
          coral: "#FF6B6B",
          sunshine: "#FFD43B",
        },
      },
      boxShadow: {
        soft: "0 2px 16px rgba(0, 0, 0, 0.06)",
        card: "0 4px 24px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
