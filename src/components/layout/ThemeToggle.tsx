"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { parseThemeChoice, resolveTheme, THEME_STORAGE_KEY, toggledTheme, type Theme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readSaved(): Theme | null {
  try {
    return parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

// The <html data-theme> attribute (set before paint by themeInitScript) is the source of truth.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle() {
  // The server can't know the theme; it renders the moon and the client corrects it after hydration.
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);

  // Until the customer picks a theme, follow the device when its setting changes.
  useEffect(() => {
    const media = matchMedia(DARK_QUERY);
    const onChange = () => {
      document.documentElement.dataset.theme = resolveTheme(readSaved(), media.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next = toggledTheme(theme);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode: the switch still works for this visit.
    }
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.05]"
    >
      {theme === "dark" ? <Sun className="size-5" strokeWidth={1.6} /> : <Moon className="size-5" strokeWidth={1.6} />}
    </button>
  );
}
