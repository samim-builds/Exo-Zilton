import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { discountStatus, getDiscountForEdit, listDiscountScopeOptions } from "@/lib/commerce/admin-queries";
import { formatMoney } from "@/lib/order-schema";
import { DiscountForm, type DiscountFormValues } from "../DiscountForm";
import { DISCOUNT_STATUS_LABELS as STATUS_LABELS, DISCOUNT_STATUS_STYLES as STATUS_STYLES, toLocalInput } from "@/lib/commerce/display";

export const metadata = {
  title: "Edit discount | Admin",
  robots: { index: false, follow: false },
};

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [discount, { categories, products }] = await Promise.all([getDiscountForEdit(id), listDiscountScopeOptions()]);
  if (!discount) notFound();
  const status = discountStatus(discount);

  const initial: DiscountFormValues = {
    id: discount.id,
    code: discount.code,
    title: discount.title,
    type: discount.type,
    percentOff: discount.percentOff,
    valuePKR: discount.valuePKR,
    valueUSD: discount.valueUSD,
    minSubtotalPKR: discount.minSubtotalPKR,
    minSubtotalUSD: discount.minSubtotalUSD,
    maxDiscountPKR: discount.maxDiscountPKR,
    maxDiscountUSD: discount.maxDiscountUSD,
    appliesTo: discount.appliesTo,
    categoryIds: discount.categoryIds,
    productIds: discount.productIds,
    startsAt: toLocalInput(discount.startsAt),
    endsAt: toLocalInput(discount.endsAt),
    usageLimit: discount.usageLimit,
    perCustomerLimit: discount.perCustomerLimit,
    firstOrderOnly: discount.firstOrderOnly,
    combinable: discount.combinable,
    active: discount.active,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={discount.code}
        description={`${discount.title} · used ${discount.usedCount}${discount.usageLimit ? ` of ${discount.usageLimit}` : ""} time(s)`}
        actions={
          <Badge variant="outline" className={STATUS_STYLES[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        }
      />
      <DiscountForm initial={initial} categories={categories} products={products} />
      <Card>
        <CardHeader>
          <CardTitle>Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          {discount.redemptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Not used yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discount.redemptions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${r.order.id}`} className="inline-flex items-center gap-2 font-medium text-navy hover:underline">
                        #{r.order.number}
                        <OrderStatusBadge status={r.order.status} />
                      </Link>
                    </TableCell>
                    <TableCell>{r.customerEmail}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(r.amount, r.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.createdAt.toLocaleDateString("en-GB")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
