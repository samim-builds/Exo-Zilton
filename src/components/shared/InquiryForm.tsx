"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inquirySchema,
  type InquiryFormData,
  countries,
} from "@/lib/inquiry-schema";
import { staticProducts } from "@/lib/products-static";

type InquiryFormProps = {
  defaultProduct?: string;
  defaultSize?: string;
};

export function InquiryForm({ defaultProduct, defaultSize }: InquiryFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      product: defaultProduct ?? "",
      size: defaultSize ?? "",
      quantity: 1,
      country: "Pakistan",
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Something went wrong");
      }

      setStatus("success");
      reset({
        name: "",
        email: "",
        phone: "",
        country: "Pakistan",
        product: defaultProduct ?? "",
        size: defaultSize ?? "",
        quantity: 1,
        message: "",
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to send inquiry");
    }
  };

  const inputClass =
    "w-full rounded-md border border-charcoal/20 bg-white px-4 py-3 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy">
            Name *
          </label>
          <input id="name" {...register("name")} className={inputClass} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy">
            Email *
          </label>
          <input id="email" type="email" {...register("email")} className={inputClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-navy">
            Phone *
          </label>
          <input id="phone" type="tel" {...register("phone")} className={inputClass} />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="mb-1 block text-sm font-medium text-navy">
            Country *
          </label>
          <select id="country" {...register("country")} className={inputClass}>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="product" className="mb-1 block text-sm font-medium text-navy">
            Product
          </label>
          <select id="product" {...register("product")} className={inputClass}>
            <option value="">Select product</option>
            {staticProducts.map((p) => (
              <option key={p.slug} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="size" className="mb-1 block text-sm font-medium text-navy">
            Size
          </label>
          <select id="size" {...register("size")} className={inputClass}>
            <option value="">Select size</option>
            {staticProducts.map((p) => (
              <option key={p.slug} value={p.size}>
                {p.size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-navy">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            max={99}
            {...register("quantity", { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-navy">
          Message *
        </label>
        <textarea
          id="message"
          rows={4}
          {...register("message")}
          className={inputClass}
          placeholder="Tell us about your order or inquiry..."
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
        )}
      </div>

      {status === "success" && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Thank you! Your inquiry has been sent. We will get back to you shortly.
        </p>
      )}

      {status === "error" && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-navy px-8 py-3 text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {status === "loading" ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}
