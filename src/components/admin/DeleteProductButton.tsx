"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    setLoading(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete product");
    }
  }

  return (
    <button type="button" onClick={handleDelete} disabled={loading} className="text-sm text-red-600 disabled:opacity-50">
      {loading ? "..." : "Delete"}
    </button>
  );
}
