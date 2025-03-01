const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        alia: {
          primary: "#34d399",
          secondary: "#10b981",
          accent: "#059669",
          },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "sphere-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "sphere-particles": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "sphere-glow": {
          "0%": { opacity: "0.5" },
          "50%": { opacity: "0.7" },
          "100%": { opacity: "0.5" },
        },
        "sphere-pulse": {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(0.95)" },
        },
        "sphere-inner": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "sphere-rotate-fast": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "sphere-particles-fast": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "sphere-glow-fast": {
          "0%": { opacity: "0.5" },
          "50%": { opacity: "0.7" },
          "100%": { opacity: "0.5" },
        },
        "sphere-pulse-fast": {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(0.95)" },
        },
        "sphere-inner-fast": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "sphere-rotate": "sphere-rotate 4s linear infinite",
        "sphere-particles": "sphere-particles 3s ease-in-out infinite",
        "sphere-glow": "sphere-glow 2s ease-in-out infinite",
        "sphere-pulse": "sphere-pulse 2s ease-in-out infinite",
        "sphere-inner": "sphere-inner 4s linear infinite",
        "sphere-rotate-fast": "sphere-rotate-fast 4s linear infinite",
        "sphere-particles-fast": "sphere-particles-fast 2s ease-in-out infinite",
        "sphere-glow-fast": "sphere-glow-fast 1.5s ease-in-out infinite",
        "sphere-pulse-fast": "sphere-pulse-fast 1s ease-in-out infinite",
        "sphere-inner-fast": "sphere-inner-fast 4s linear infinite",
      },
      gridTemplateColumns: {
        '53': 'repeat(53, minmax(0, 1fr))',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
// animation: {
//   "accordion-down": "accordion-down 0.2s ease-out",
//   "accordion-up": "accordion-up 0.2s ease-out",
//   "fade-in": "fade-in 0.5s ease-out",
//   "sphere-rotate": "sphere-rotate 10s linear infinite",
//   "sphere-particles": "sphere-particles 3s ease-in-out infinite",
//   "sphere-glow": "sphere-glow 4s ease-in-out infinite",
//   "sphere-pulse": "sphere-pulse 2s ease-in-out infinite",
//   "sphere-inner": "sphere-inner 8s linear infinite",
//   "sphere-rotate-fast": "sphere-rotate-fast 6s linear infinite",
//   "sphere-particles-fast": "sphere-particles-fast 2s ease-in-out infinite",
//   "sphere-glow-fast": "sphere-glow-fast 2s ease-in-out infinite",
//   "sphere-pulse-fast": "sphere-pulse-fast 1.5s ease-in-out infinite",
//   "sphere-inner-fast": "sphere-inner-fast 4s linear infinite",
// },