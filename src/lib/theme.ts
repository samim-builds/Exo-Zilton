// Storefront light/dark theme. Client-safe; the admin panel always stays light.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "exo_zilton_theme";

/** A saved choice, or null when the customer hasn't picked one (follow the device). */
export function parseThemeChoice(raw: string | null): Theme | null {
  return raw === "light" || raw === "dark" ? raw : null;
}

export function resolveTheme(choice: Theme | null, systemDark: boolean): Theme {
  return choice ?? (systemDark ? "dark" : "light");
}

export function toggledTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/**
 * Runs inline in <head> before the page paints, so a dark-mode visitor never
 * sees a white flash. Mirrors parseThemeChoice + resolveTheme.
 */
export const themeInitScript = `(function(){var c=null;try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(s==="light"||s==="dark")c=s}catch(e){}var d=false;try{d=matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}document.documentElement.dataset.theme=c||(d?"dark":"light")})()`;
