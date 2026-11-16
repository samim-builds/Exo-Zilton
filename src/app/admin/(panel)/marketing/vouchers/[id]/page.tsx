import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { getVoucher } from "@/lib/commerce/admin-queries";
import { formatMoney } from "@/lib/order-schema";
import { voucherState } from "@/lib/commerce/display";
import { VoucherControls } from "./VoucherControls";

export const metadata = {
  title: "Gift voucher | Admin",
  robots: { index: false, follow: false },
};

const REASON_LABELS: Record<string, string> = {
  ISSUE: "Issued",
  REDEEM: "Spent on order",
  REFUND: "Refunded",
  ADJUST: "Adjusted",
};

export default async function VoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const voucher = await getVoucher(id);
  if (!voucher) notFound();
  const state = voucherState(voucher);
  const money = (n: number) => formatMoney(n, voucher.currency);

  return (
    <div className="space-y-6">
      <PageHeader
        title={voucher.code}
        description={`${money(voucher.balance)} left of ${money(voucher.initialBalance)}`}
        actions={
          <Badge variant="outline" className={state.className}>
            {state.label}
          </Badge>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voucher.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {t.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      {REASON_LABELS[t.reason] ?? t.reason}
                      {t.order && (
                        <Link href={`/admin/orders/${t.order.id}`} className="ml-1 text-navy hover:underline">
                          #{t.order.number}
                        </Link>
                      )}
                      {t.note && <span className="block text-xs text-muted-foreground">{t.note}</span>}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${t.delta < 0 ? "text-destructive" : "text-green-700"}`}>
                      {t.delta > 0 ? "+" : "-"}
                      {money(Math.abs(t.delta))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <VoucherControls id={voucher.id} active={voucher.active} currency={voucher.currency} />
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Reason:</span> {voucher.issuedReason.toLowerCase()}
              </p>
              <p>
                <span className="text-muted-foreground">Expires:</span>{" "}
                {voucher.expiresAt ? voucher.expiresAt.toLocaleDateString("en-GB", { dateStyle: "long" }) : "Never"}
              </p>
              {voucher.recipientEmail && (
                <p>
                  <span className="text-muted-foreground">Recipient:</span> {voucher.recipientEmail}
                </p>
              )}
              {voucher.note && <p className="text-muted-foreground">{voucher.note}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
