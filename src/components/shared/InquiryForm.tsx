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
import { Button } from "@/components/site/Button";
import { controlClass } from "@/components/site/Field";

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

  const inputClass = controlClass;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Name *
          </label>
          <input id="name" {...register("name")} className={inputClass} />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-700" role="alert">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email *
          </label>
          <input id="email" type="email" {...register("email")} className={inputClass} />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-700" role="alert">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
            Phone *
          </label>
          <input id="phone" type="tel" {...register("phone")} className={inputClass} />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-700" role="alert">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-ink">
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
            <p className="mt-1.5 text-xs text-red-700" role="alert">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="product" className="mb-1.5 block text-sm font-medium text-ink">
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
          <label htmlFor="size" className="mb-1.5 block text-sm font-medium text-ink">
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
          <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-ink">
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
            <p className="mt-1.5 text-xs text-red-700" role="alert">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
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
          <p className="mt-1.5 text-xs text-red-700" role="alert">{errors.message.message}</p>
        )}
      </div>

      {status === "success" && (
        <p className="rounded-[6px] bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Thank you! Your inquiry has been sent. We will get back to you shortly.
        </p>
      )}

      {status === "error" && (
        <p className="rounded-[6px] bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage}
        </p>
      )}

      <Button type="submit" size="lg" loading={status === "loading"} className="w-full sm:w-auto">
        Send message
      </Button>
    </form>
  );
}
