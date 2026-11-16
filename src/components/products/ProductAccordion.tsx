"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
};

type ProductAccordionProps = {
  items: AccordionItem[];
};

export function ProductAccordion({ items }: ProductAccordionProps) {
  const [openId, setOpenId] = useState(items[0]?.id ?? "");
  const baseId = useId();

  return (
    <div className="divide-y divide-glaze border-y border-glaze">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}`;
        return (
          <div key={item.id}>
            <h2 className="font-sans">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : item.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-medium text-ink"
              >
                {item.title}
                <Plus className={cn("size-5 shrink-0 text-stone transition-transform duration-200", isOpen && "rotate-45")} aria-hidden />
              </button>
            </h2>
            {isOpen && (
              <div id={panelId} className="max-w-prose pb-7 text-[0.9375rem] text-stone">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
