"use client";

import { useState, type ReactNode } from "react";

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

  return (
    <div className="divide-y divide-cream border border-cream rounded-lg">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? "" : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between px-6 py-4 text-left font-serif text-lg text-navy hover:bg-cream/50"
            >
              {item.title}
              <span className="text-gold">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="px-6 pb-6 text-sm leading-relaxed text-charcoal/80">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
