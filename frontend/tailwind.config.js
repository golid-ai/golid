import { fontFamily } from "tailwindcss/defaultTheme";
import { withTV } from "tailwind-variants/transformer";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  plugins: [typography],
  safelist: [
    "dark",
    // Swatch hover states for styleguide
    "hover:bg-active-green",
    "hover:bg-active-blue",
    "hover:bg-active-red",
    "hover:bg-active-gold",
    "hover:bg-active-teal",
    "hover:bg-active-indigo",
    "hover:bg-active-violet",
    "hover:bg-active-pink",
    "hover:bg-active-orange",
    "hover:bg-active-lime",
    "hover:bg-neon-green-active",
    "hover:bg-neon-blue-active",
    "hover:bg-neon-red-active",
    "hover:bg-neon-gold-active",
    "hover:bg-neon-teal-active",
    "hover:bg-neon-indigo-active",
    "hover:bg-neon-violet-active",
    "hover:bg-neon-pink-active",
    "hover:bg-neon-orange-active",
    "hover:bg-neon-lime-active",
    // CTA button hover states
    "hover:bg-cta-green-active",
    "hover:bg-cta-teal-active",
    "hover:bg-cta-blue-active",
    "hover:bg-cta-indigo-active",
    "hover:bg-cta-violet-active",
    "hover:bg-cta-pink-active",
    "hover:bg-cta-orange-active",
    "hover:bg-cta-gold-active",
    "hover:bg-cta-lime-active",
    "hover:bg-danger-active",
    "hover:bg-bright"
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1600px"
    },
    container: {
      center: true,
      padding: "2rem"
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
        },
        neutral: {
          DEFAULT: "hsl(var(--neutral) / <alpha-value>)",
          foreground: "hsl(var(--neutral-foreground) / <alpha-value>)"
        },
        danger: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          active: "hsl(var(--danger-active) / <alpha-value>)",
          foreground: "hsl(var(--danger-foreground) / <alpha-value>)"
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)"
        },

        // Legacy Brand Channels
        midnight: "hsl(var(--midnight-ch) / <alpha-value>)",
        moonlight: "hsl(var(--moonlight-ch) / <alpha-value>)",
        twilight: "hsl(var(--twilight-ch) / <alpha-value>)",
        dusk: "hsl(var(--dusk-ch) / <alpha-value>)",
        granite: "hsl(var(--granite-ch) / <alpha-value>)",
        steel: "hsl(var(--steel-ch) / <alpha-value>)",
        dawn: "hsl(var(--dawn-ch) / <alpha-value>)",
        bright: "hsl(var(--bright-ch) / <alpha-value>)",
        mist: "hsl(var(--mist-ch) / <alpha-value>)",
        white: "hsl(var(--white-ch) / <alpha-value>)",

        // Extended Palette
        green: "hsl(var(--green-ch) / <alpha-value>)",
        "active-green": "hsl(var(--active-green-ch) / <alpha-value>)",
        teal: "hsl(var(--teal-ch) / <alpha-value>)",
        "active-teal": "hsl(var(--active-teal-ch) / <alpha-value>)",
        blue: "hsl(var(--blue-ch) / <alpha-value>)",
        "active-blue": "hsl(var(--active-blue-ch) / <alpha-value>)",
        indigo: "hsl(var(--indigo-ch) / <alpha-value>)",
        "active-indigo": "hsl(var(--active-indigo-ch) / <alpha-value>)",
        violet: "hsl(var(--violet-ch) / <alpha-value>)",
        "active-violet": "hsl(var(--active-violet-ch) / <alpha-value>)",
        pink: "hsl(var(--pink-ch) / <alpha-value>)",
        "active-pink": "hsl(var(--active-pink-ch) / <alpha-value>)",
        red: "hsl(var(--red-ch) / <alpha-value>)",
        "active-red": "hsl(var(--active-red-ch) / <alpha-value>)",
        orange: "hsl(var(--orange-ch) / <alpha-value>)",
        "active-orange": "hsl(var(--active-orange-ch) / <alpha-value>)",
        gold: "hsl(var(--gold-ch) / <alpha-value>)",
        "active-gold": "hsl(var(--active-gold-ch) / <alpha-value>)",
        lime: "hsl(var(--lime-ch) / <alpha-value>)",
        "active-lime": "hsl(var(--active-lime-ch) / <alpha-value>)",

        // Neon Palette
        "neon-green": "hsl(var(--neon-green-ch) / <alpha-value>)",
        "neon-green-active": "hsl(var(--neon-green-active-ch) / <alpha-value>)",
        "neon-teal": "hsl(var(--neon-teal-ch) / <alpha-value>)",
        "neon-teal-active": "hsl(var(--neon-teal-active-ch) / <alpha-value>)",
        "neon-blue": "hsl(var(--neon-blue-ch) / <alpha-value>)",
        "neon-blue-active": "hsl(var(--neon-blue-active-ch) / <alpha-value>)",
        "neon-indigo": "hsl(var(--neon-indigo-ch) / <alpha-value>)",
        "neon-indigo-active": "hsl(var(--neon-indigo-active-ch) / <alpha-value>)",
        "neon-violet": "hsl(var(--neon-violet-ch) / <alpha-value>)",
        "neon-violet-active": "hsl(var(--neon-violet-active-ch) / <alpha-value>)",
        "neon-pink": "hsl(var(--neon-pink-ch) / <alpha-value>)",
        "neon-pink-active": "hsl(var(--neon-pink-active-ch) / <alpha-value>)",
        "neon-red": "hsl(var(--neon-red-ch) / <alpha-value>)",
        "neon-red-active": "hsl(var(--neon-red-active-ch) / <alpha-value>)",
        "neon-orange": "hsl(var(--neon-orange-ch) / <alpha-value>)",
        "neon-orange-active": "hsl(var(--neon-orange-active-ch) / <alpha-value>)",
        "neon-gold": "hsl(var(--neon-gold-ch) / <alpha-value>)",
        "neon-gold-active": "hsl(var(--neon-gold-active-ch) / <alpha-value>)",
        "neon-lime": "hsl(var(--neon-lime-ch) / <alpha-value>)",
        "neon-lime-active": "hsl(var(--neon-lime-active-ch) / <alpha-value>)",

        // CTA Mappings
        "cta-green": {
          DEFAULT: "hsl(var(--cta-green) / <alpha-value>)",
          active: "hsl(var(--cta-green-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-green-foreground) / <alpha-value>)"
        },
        "cta-teal": {
          DEFAULT: "hsl(var(--cta-teal) / <alpha-value>)",
          active: "hsl(var(--cta-teal-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-teal-foreground) / <alpha-value>)"
        },
        "cta-blue": {
          DEFAULT: "hsl(var(--cta-blue) / <alpha-value>)",
          active: "hsl(var(--cta-blue-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-blue-foreground) / <alpha-value>)"
        },
        "cta-indigo": {
          DEFAULT: "hsl(var(--cta-indigo) / <alpha-value>)",
          active: "hsl(var(--cta-indigo-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-indigo-foreground) / <alpha-value>)"
        },
        "cta-violet": {
          DEFAULT: "hsl(var(--cta-violet) / <alpha-value>)",
          active: "hsl(var(--cta-violet-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-violet-foreground) / <alpha-value>)"
        },
        "cta-pink": {
          DEFAULT: "hsl(var(--cta-pink) / <alpha-value>)",
          active: "hsl(var(--cta-pink-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-pink-foreground) / <alpha-value>)"
        },
        "cta-red": {
          DEFAULT: "hsl(var(--cta-red) / <alpha-value>)",
          active: "hsl(var(--cta-red-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-red-foreground) / <alpha-value>)"
        },
        "cta-orange": {
          DEFAULT: "hsl(var(--cta-orange) / <alpha-value>)",
          active: "hsl(var(--cta-orange-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-orange-foreground) / <alpha-value>)"
        },
        "cta-gold": {
          DEFAULT: "hsl(var(--cta-gold) / <alpha-value>)",
          active: "hsl(var(--cta-gold-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-gold-foreground) / <alpha-value>)"
        },
        "cta-lime": {
          DEFAULT: "hsl(var(--cta-lime) / <alpha-value>)",
          active: "hsl(var(--cta-lime-active) / <alpha-value>)",
          foreground: "hsl(var(--cta-lime-foreground) / <alpha-value>)"
        }
      },
      boxShadow: {
        modern: "0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
        glow: "0 0 20px rgba(0, 200, 180, 0.3)",
        "glow-green": "0 0 20px rgba(52, 211, 153, 0.4)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.4)",
        "glow-pink": "0 0 20px rgba(236, 72, 153, 0.4)"
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-down": "slide-down 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.15s ease-in",
        ripple: "ripple 0.6s linear forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spin: "spin 1s linear infinite",
        bounce: "bounce 1s infinite",
        ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" }
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.35" },
          "100%": { transform: "scale(4)", opacity: "0" }
        }
      },
      backgroundImage: {
        "dark-grad": "var(--dark-grad)",
        "light-grad": "var(--light-grad)",
        "blue-grad": "var(--blue-grad)"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        montserrat: ["Montserrat", ...fontFamily.sans],
        nunito: ["Nunito", ...fontFamily.sans]
      }
    }
  }
};

export default withTV(config);
