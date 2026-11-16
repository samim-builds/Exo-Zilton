import { PageHeader } from "@/components/admin/shell/PageHeader";
import { listDiscountScopeOptions } from "@/lib/commerce/admin-queries";
import { DiscountForm, type DiscountFormValues } from "../DiscountForm";

export const metadata = {
  title: "New discount | Admin",
  robots: { index: false, follow: false },
};

const blank: DiscountFormValues = {
  code: "",
  title: "",
  type: "PERCENT",
  percentOff: 10,
  valuePKR: null,
  valueUSD: null,
  minSubtotalPKR: null,
  minSubtotalUSD: null,
  maxDiscountPKR: null,
  maxDiscountUSD: null,
  appliesTo: "ALL",
  categoryIds: [],
  productIds: [],
  startsAt: "",
  endsAt: "",
  usageLimit: null,
  perCustomerLimit: null,
  firstOrderOnly: false,
  combinable: true,
  active: true,
};

export default async function NewDiscountPage() {
  const { categories, products } = process.env.DATABASE_URL
    ? await listDiscountScopeOptions()
    : { categories: [], products: [] };
  return (
    <div>
      <PageHeader title="New discount" description="A code customers enter at checkout." />
      <DiscountForm initial={blank} categories={categories} products={products} />
    </div>
  );
}
