import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seashell: "#FFF4EB",
        wheat: "#F6E0B6",
        powder: "#A6BCC9",
        french: "#3E4B8E",
        midnight: "#3D1534",
      },
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        bubble: "0 8px 0 0 #3D1534",
        card: "0 10px 30px rgba(61, 21, 52, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
