import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f7f4",
          100: "#ddece3",
          600: "#2f6b55",
          700: "#255744",
          800: "#1f4639"
        },
        linen: "#f7f1e8",
        amberSoft: "#d9a441",
        ink: "#18322a"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(25, 50, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
