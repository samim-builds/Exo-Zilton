"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { matchNav } from "@/lib/admin/search";
import { searchAdmin, type SearchHit, type SearchResults } from "@/app/admin/(panel)/_search/actions";
import { adminNav } from "./nav-config";

const navItems = adminNav.flatMap((group) => group.items);
const none: SearchResults = { products: [], orders: [], pages: [] };

const noSubscribe = () => () => {};
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// ⌘K / Ctrl+K: jump to an admin page, or find a product, order or page.
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; data: SearchResults }>({ q: "", data: none });
  const [highlighted, setHighlighted] = useState("");
  // The server can't know the platform; it renders "Ctrl K" and Apple devices switch after hydration.
  const apple = useSyncExternalStore(noSubscribe, isApple, () => false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced server search; stale answers are ignored.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await searchAdmin({ q });
      if (!cancelled && res.ok) {
        setResults({ q, data: res.data });
        // Highlight the best match so Enter opens it rather than a page link.
        const first = res.data.orders[0] ?? res.data.products[0] ?? res.data.pages[0];
        if (first) setHighlighted(first.href);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const q = query.trim();
  const data = q.length >= 2 && results.q === q ? results.data : none;
  const searching = q.length >= 2 && results.q !== q;
  const pages = matchNav(navItems, q);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hits = (heading: string, items: SearchHit[], Icon: typeof Package) =>
    items.length > 0 && (
      <CommandGroup heading={heading}>
        {items.map((hit) => (
          <CommandItem key={hit.href} value={hit.href} onSelect={() => go(hit.href)}>
            <Icon className="text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{hit.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{hit.detail}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground sm:w-56 sm:justify-start"
        aria-label="Search admin"
      >
        <Search />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-sans text-[11px] sm:inline">{apple ? "⌘K" : "Ctrl K"}</kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        shouldFilter={false}
        value={highlighted}
        onValueChange={setHighlighted}
        title="Search admin"
        description="Go to a page, or find a product, order or page by name, SKU, email or order number."
      >
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search products, orders, pages, or go to…" />
        <CommandList>
          <CommandEmpty>{searching ? "Searching…" : "Nothing found."}</CommandEmpty>
          {hits("Orders", data.orders, ClipboardList)}
          {hits("Products and bundles", data.products, Package)}
          {hits("Content pages", data.pages, FileText)}
          {pages.length > 0 && (
            <CommandGroup heading="Go to">
              {pages.map((item) => (
                <CommandItem key={item.href} value={`nav:${item.href}`} onSelect={() => go(item.href)}>
                  <item.icon className="text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
