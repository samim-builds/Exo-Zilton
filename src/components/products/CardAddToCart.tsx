"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { track } from "@vercel/analytics";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/site/Button";
import { cardCartLine } from "@/lib/catalog/storefront";
import type { Product } from "@/lib/product-types";

// Adds one of this card's variant without leaving the listing, so customers
// can pick up several sizes in a row. The header count shows the cart grew.
export function CardAddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(id);
  }, [added]);

  function add() {
    addItem(cardCartLine(product), 1);
    setAdded(true);
    track("add_to_cart", { product: product.slug, sku: product.sku, quantity: 1, from: "card" });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4 w-full"
        disabled={!product.inStock}
        onClick={add}
        aria-label={product.inStock ? `Add ${product.name} to cart` : undefined}
      >
        {!product.inStock ? (
          "Out of stock"
        ) : added ? (
          <>
            <Check aria-hidden />
            Added
          </>
        ) : (
          "Add to cart"
        )}
      </Button>
      <span className="sr-only" role="status">
        {added ? `${product.name} added to your cart` : ""}
      </span>
    </>
  );
}
