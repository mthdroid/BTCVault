/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],

  darkTheme: "dark",

  themes: [
    {
      light: {
        primary: "#F7931A",
        "primary-content": "#ffffff",
        secondary: "#0C0C4F",
        "secondary-content": "#ffffff",
        accent: "#29296E",
        "accent-content": "#ffffff",
        neutral: "#1a1a2e",
        "neutral-content": "#ffffff",
        "base-100": "#ffffff",
        "base-200": "#F7F8FA",
        "base-300": "#E8ECFB",
        "base-content": "#1a1a2e",
        info: "#29296E",
        success: "#27AE60",
        warning: "#F7931A",
        error: "#EB5757",
        ".bg-gradient-modal": {
          "background-image":
            "linear-gradient(135deg, #FFF5E6 0%, #E8ECFB 100%)",
        },
        ".bg-modal": {
          background:
            "linear-gradient(135deg, #ffffff 0%, #F7F8FA 100%)",
        },
        ".modal-border": {
          border: "1px solid #E8ECFB",
        },
        ".bg-gradient-nav": {
          background: "#0C0C4F",
        },
        ".bg-main": {
          background: "#F7F8FA",
        },
        ".bg-underline": {
          background:
            "linear-gradient(90deg, #F7931A 0%, #29296E 100%)",
        },
        ".bg-container": {
          background: "transparent",
        },
        ".bg-btn-wallet": {
          "background-image":
            "linear-gradient(135deg, #F7931A 0%, #E8820E 100%)",
        },
        ".bg-input": {
          background: "#F7F8FA",
        },
        ".bg-component": {
          background: "rgba(255, 255, 255, 0.85)",
        },
        ".bg-function": {
          background:
            "linear-gradient(135deg, #FFF5E6 0%, #E8ECFB 100%)",
        },
        ".text-function": {
          color: "#0C0C4F",
        },
        ".text-network": {
          color: "#F7931A",
        },
        "--rounded-btn": "9999rem",

        ".tooltip": {
          "--tooltip-tail": "6px",
        },
        ".link": {
          textUnderlineOffset: "2px",
        },
        ".link:hover": {
          opacity: "80%",
        },
        ".contract-content": {
          background: "white",
        },
      },
    },
    {
      dark: {
        primary: "#F7931A",
        "primary-content": "#ffffff",
        secondary: "#29296E",
        "secondary-content": "#ffffff",
        accent: "#4969A6",
        "accent-content": "#F9FBFF",
        neutral: "#F9FBFF",
        "neutral-content": "#8B92A5",
        "base-100": "#191B1F",
        "base-200": "#212429",
        "base-300": "#2C2F36",
        "base-content": "#F9FBFF",
        info: "#4969A6",
        success: "#27AE60",
        warning: "#F7931A",
        error: "#EB5757",
        ".bg-gradient-modal": {
          background: "#2C2F36",
        },
        ".bg-modal": {
          background: "linear-gradient(135deg, #212429 0%, #2C2F36 100%)",
        },
        ".modal-border": {
          border: "1px solid #40444F",
        },
        ".bg-gradient-nav": {
          "background-image":
            "linear-gradient(90deg, #F7931A 0%, #29296E 100%)",
        },
        ".bg-main": {
          background: "#191B1F",
        },
        ".bg-underline": {
          background: "#40444F",
        },
        ".bg-container": {
          background: "#191B1F",
        },
        ".bg-btn-wallet": {
          "background-image":
            "linear-gradient(135deg, #F7931A 0%, #E8820E 100%)",
        },
        ".bg-input": {
          background: "#2C2F36",
        },
        ".bg-component": {
          background: "#212429",
        },
        ".bg-function": {
          background: "rgba(247, 147, 26, 0.15)",
        },
        ".text-function": {
          color: "#F7931A",
        },
        ".text-network": {
          color: "#F7931A",
        },

        "--rounded-btn": "9999rem",

        ".tooltip": {
          "--tooltip-tail": "6px",
          "--tooltip-color": "oklch(var(--p))",
        },
        ".link": {
          textUnderlineOffset: "2px",
        },
        ".link:hover": {
          opacity: "80%",
        },
        ".contract-content": {
          background: "#212429",
        },
      },
    },
  ],

  theme: {
    extend: {
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        "gradient-light":
          "linear-gradient(135deg, #FFF5E6 0%, #E8ECFB 100%)",
        "gradient-dark":
          "linear-gradient(90deg, #F7931A 0%, #29296E 100%)",
        "gradient-vertical":
          "linear-gradient(135deg, #F7931A 0%, #E8820E 100%)",
        "gradient-icon":
          "linear-gradient(90deg, #F7931A 0%, #29296E 100%)",
      },
    },
  },
};
