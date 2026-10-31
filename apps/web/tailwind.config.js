/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        sidebar: "var(--bg-sidebar)",
        topbar: "var(--bg-topbar)",
        panel: "var(--bg-panel)",
        "panel-2": "var(--bg-panel-2)",
        hover: "var(--bg-hover)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-soft": "var(--primary-soft)",
        "primary-bg": "var(--primary-bg)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
      },
      fontSize: {
        xs: "11px",
        sm: "12.5px",
        md: "14px",
        lg: "16px",
        xl: "22px",
      },
      spacing: {
        "sidebar-w": "207px",
        "topbar-h": "56px",
      },
    },
  },
  plugins: [],
};
