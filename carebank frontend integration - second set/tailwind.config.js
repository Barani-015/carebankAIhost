/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#07070A",
          900: "#0B0B0F",
          850: "#101014",
          800: "#15151B",
          700: "#1D1D24",
          600: "#2A2A33",
          500: "#3B3B46",
        },
        amber: {
          400: "#FFC26B",
          500: "#F5A93F",
          600: "#E8892B",
          700: "#C46A1C",
        },
        ember: {
          500: "#FF6B3D",
          600: "#E14E24",
        },
        cyan: {
          400: "#6FE3FF",
          500: "#3FC9F0",
        },
        bone: "#EDE7DA",
      },
      fontFamily: {
        display: ["Chakra Petch", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(245, 169, 63, 0.25)",
        "glow-lg": "0 0 80px rgba(245, 169, 63, 0.35)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
      animation: {
        scanline: "scanline 6s linear infinite",
        fadeUp: "fadeUp 0.6s ease forwards",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
