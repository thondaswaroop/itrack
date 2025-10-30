import { useEffect } from "react"
import { applyPalette, type ThemeName } from "./colors"

/**
 * GlobalStyles
 * - applies the palette (from colors.ts)
 * - defines brand tokens for sidebar/menu
 * - injects CSS for .menu-item-* classes using theme variables
 */
export default function GlobalStyles({
  initial = "light",
  followSystem = false,
}: {
  initial?: ThemeName
  followSystem?: boolean
}) {
  useEffect(() => {
    const root = document.documentElement

    const setTheme = (t: ThemeName) => {
      // 1) write base palette vars
      applyPalette(t, root)

      // 2) derive "brand" tokens from primary
      // brand-500 mirrors primary; brand-50 is a soft tint of primary
      const primary = getComputedStyle(root).getPropertyValue("--color-primary").trim() || "#2563eb"
      root.style.setProperty("--color-brand-500", primary)
      // color-mix works in modern browsers; falls back gracefully if not supported
      root.style.setProperty("--color-brand-50", "color-mix(in srgb, var(--color-primary) 12%, transparent)")

      // 3) ensure our menu CSS is injected once
      const STYLE_ID = "itrack-global-styles"
      let tag = document.getElementById(STYLE_ID) as HTMLStyleElement | null
      const css = `
        /* --- iTrack menu tokens --- */
        .menu-item            { display:flex; align-items:center; gap:.75rem; padding:.625rem .75rem; border-radius:.5rem; transition:background-color .2s ease,color .2s ease; }
        .menu-item-inactive   { background-color: transparent; color: var(--color-text); }
        .menu-item-inactive:hover { background-color: var(--color-surfaceMuted); color: var(--color-text); }

        .menu-item-active     { background-color: var(--color-brand-50); color: var(--color-brand-500); }

        .menu-dropdown-item             { display:block; padding:.5rem .625rem; border-radius:.375rem; transition:background-color .2s ease,color .2s ease; }
        .menu-dropdown-item-inactive    { background-color: transparent; color: var(--color-text); }
        .menu-dropdown-item-inactive:hover { background-color: var(--color-surfaceMuted); color: var(--color-text); }
        .menu-dropdown-item-active      { background-color: var(--color-brand-50); color: var(--color-brand-500); }

        /* optional: icon color inside active items follows text color automatically via currentColor */
        .menu-item .menu-item-icon-size svg { width: 20px; height: 20px; }
      `
      if (!tag) {
        tag = document.createElement("style")
        tag.id = STYLE_ID
        tag.appendChild(document.createTextNode(css))
        document.head.appendChild(tag)
      } else {
        tag.textContent = css
      }
    }

    if (!followSystem) {
      setTheme(initial)
      return
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setTheme(mq.matches ? "dark" : "light")
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [initial, followSystem])

  return null
}
