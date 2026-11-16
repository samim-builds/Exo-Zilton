"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTableUrl } from "./use-table-url";

// Sortable header: cycles desc → asc → default via the `sort` URL param.
export function ColumnHeader({ id, title, className }: { id: string; title: string; className?: string }) {
  const { searchParams, update } = useTableUrl();
  const [sortId, sortDir] = (searchParams.get("sort") ?? "").split(".");
  const active = sortId === id;
  const desc = active && sortDir !== "asc";

  function toggle() {
    if (!active) update({ sort: `${id}.desc` });
    else if (desc) update({ sort: `${id}.asc` });
    else update({ sort: null });
  }

  const Icon = !active ? ChevronsUpDown : desc ? ArrowDown : ArrowUp;

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className={cn("-ml-3 h-8 data-[active=true]:text-foreground", className)} data-active={active}>
      {title}
      <Icon className="size-3.5 opacity-60" />
    </Button>
  );
}
