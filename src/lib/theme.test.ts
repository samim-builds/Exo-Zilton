import { describe, expect, it } from "vitest";
import { parseThemeChoice, resolveTheme, themeInitScript, toggledTheme } from "./theme";

describe("parseThemeChoice", () => {
  it("accepts only a saved light or dark choice", () => {
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice("light")).toBe("light");
    expect(parseThemeChoice("blue")).toBeNull();
    expect(parseThemeChoice(null)).toBeNull();
  });
});

describe("resolveTheme", () => {
  it("follows the device until the customer picks one", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("keeps the customer's choice over the device setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("toggledTheme", () => {
  it("switches to the other theme", () => {
    expect(toggledTheme("dark")).toBe("light");
    expect(toggledTheme("light")).toBe("dark");
  });
});

describe("themeInitScript", () => {
  it("sets the theme before first paint using the same rules", () => {
    const html = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
    const run = (saved: string | null, systemDark: boolean) => {
      html.dataset = {};
      new Function("document", "localStorage", "matchMedia", themeInitScript)(
        { documentElement: html },
        { getItem: () => saved },
        () => ({ matches: systemDark }),
      );
      return html.dataset.theme;
    };
    expect(run(null, true)).toBe("dark");
    expect(run("light", true)).toBe("light");
    expect(run("dark", false)).toBe("dark");
  });

  it("falls back to light when storage is blocked", () => {
    const html = { dataset: {} as Record<string, string> };
    new Function("document", "localStorage", "matchMedia", themeInitScript)(
      { documentElement: html },
      { getItem: () => { throw new Error("blocked"); } },
      () => ({ matches: false }),
    );
    expect(html.dataset.theme).toBe("light");
  });
});
