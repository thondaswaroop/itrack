export type Palette = {
    // brand
    primary: string
    primaryHover: string
    primaryActive: string
    onPrimary: string
  
    // surfaces
    bg: string
    surface: string
    surfaceMuted: string
    border: string
    overlay: string
  
    // text
    text: string
    textMuted: string
  
    // semantic
    success: string
    warning: string
    danger: string
  }
  
  export const light: Palette = {
    primary: "#ef8421",
    primaryHover: "#e86902",
    primaryActive: "#fe8a2c",
    onPrimary: "#ffffff",
  
    bg: "#f8fafc",
    surface: "#ffffff",
    surfaceMuted: "#f3f4f6",
    border: "#e5e7eb",
    overlay: "rgba(0,0,0,0.4)",
  
    text: "#0f172a",
    textMuted: "#64748b",
  
    success: "#16a34a",
    warning: "#f59e0b",
    danger:  "#ef4444",
  }
  
  export const dark: Palette = {
    primary: "#60a5fa",
    primaryHover: "#3b82f6",
    primaryActive: "#2563eb",
    onPrimary: "#0b0f19",
  
    bg: "#0b0f19",
    surface: "#121829",
    surfaceMuted: "#0e1527",
    border: "#1f2a44",
    overlay: "rgba(0,0,0,0.6)",
  
    text: "#e5e7eb",
    textMuted: "#94a3b8",
  
    success: "#22c55e",
    warning: "#fbbf24",
    danger:  "#f87171",
  }
  
  export type ThemeName = "light" | "dark"
  export const palettes: Record<ThemeName, Palette> = { light, dark }
  
  export function applyPalette(theme: ThemeName, root: HTMLElement = document.documentElement) {
    const p = palettes[theme]
    Object.entries(p).forEach(([k, v]) => {
      root.style.setProperty(`--color-${k}`, v)
    })
    root.setAttribute("data-theme", theme)
  }
  
  export function setTheme(theme: ThemeName) {
    applyPalette(theme)
  }
  
  export function getColor(name: keyof Palette, theme: ThemeName = "light") {
    return palettes[theme][name]
  }
  