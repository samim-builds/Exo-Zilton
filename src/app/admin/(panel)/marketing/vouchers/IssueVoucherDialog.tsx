"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form/Field";
import { issueVouchers } from "./actions";

type FormState = {
  currency: "PKR" | "USD";
  amount: number | null;
  quantity: number;
  code: string;
  expiresAt: string;
  recipientEmail: string;
  note: string;
  reason: "PURCHASE" | "GIFT" | "REFUND" | "PROMO";
  sendToRecipient: boolean;
};

const INITIAL: FormState = {
  currency: "PKR",
  amount: null,
  quantity: 1,
  code: "",
  expiresAt: "",
  recipientEmail: "",
  note: "",
  reason: "GIFT",
  sendToRecipient: false,
};

export function IssueVoucherDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [issued, setIssued] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setForm(INITIAL);
      setErrors({});
      setIssued(null);
      setCopied(false);
    }
  }

  function submit() {
    start(async () => {
      const res = await issueVouchers({
        ...form,
        amount: form.amount ?? 0,
        code: form.code.trim() || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      setIssued(res.data.codes);
      toast.success(`${res.data.codes.length} voucher(s) issued`);
      router.refresh();
    });
  }

  async function copyCodes() {
    if (!issued) return;
    await navigator.clipboard.writeText(issued.join("\n"));
    setCopied(true);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Issue vouchers
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{issued ? "Vouchers issued" : "Issue gift vouchers"}</DialogTitle>
          <DialogDescription>
            {issued ? "Share these codes with the recipients." : "Each voucher holds a balance customers spend at checkout."}
          </DialogDescription>
        </DialogHeader>

        {issued ? (
          <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-3 font-mono text-sm">
            {issued.map((code) => (
              <div key={code}>{code}</div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <Select value={form.currency} onValueChange={(v) => set("currency", v as FormState["currency"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR (Pakistan orders)</SelectItem>
                  <SelectItem value="USD">USD (international orders)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Amount" error={errors.amount}>
              <Input
                type="number"
                min={1}
                value={form.amount ?? ""}
                onChange={(e) => set("amount", e.target.value === "" ? null : Math.round(Number(e.target.value)))}
              />
            </Field>
            <Field label="How many" error={errors.quantity}>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.quantity}
                onFocus={(e) => e.target.select()}
                onChange={(e) => set("quantity", Math.max(1, Math.min(200, Math.round(Number(e.target.value)) || 1)))}
              />
            </Field>
            <Field label="Reason">
              <Select value={form.reason} onValueChange={(v) => set("reason", v as FormState["reason"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GIFT">Gift</SelectItem>
                  <SelectItem value="PURCHASE">Bought by a customer</SelectItem>
                  <SelectItem value="REFUND">Refund as store credit</SelectItem>
                  <SelectItem value="PROMO">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.quantity === 1 && (
              <Field label="Custom code (optional)" error={errors.code}>
                <Input value={form.code} placeholder="Generated" onChange={(e) => set("code", e.target.value.toUpperCase())} className="font-mono" />
              </Field>
            )}
            <Field label="Expires (optional)" error={errors.expiresAt}>
              <Input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value ? `${e.target.value}T23:59` : "")} />
            </Field>
            <Field label="Recipient email (optional)" error={errors.recipientEmail} className="sm:col-span-2">
              <Input type="email" value={form.recipientEmail} onChange={(e) => set("recipientEmail", e.target.value)} />
            </Field>
            {form.recipientEmail && (
              <label className="flex items-center justify-between gap-4 text-sm sm:col-span-2">
                Email the code{form.quantity > 1 ? "s" : ""} to the recipient
                <Switch checked={form.sendToRecipient} onCheckedChange={(c) => set("sendToRecipient", c)} />
              </label>
            )}
            <Field label="Note (optional)" className="sm:col-span-2">
              <Textarea rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </div>
        )}

        <DialogFooter>
          {issued ? (
            <>
              <Button variant="outline" onClick={copyCodes}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy codes"}
              </Button>
              <Button onClick={() => reset(false)}>Done</Button>
            </>
          ) : (
            <Button onClick={submit} disabled={pending || !form.amount}>
              {pending && <Loader2 className="animate-spin" />}
              Issue {form.quantity > 1 ? `${form.quantity} vouchers` : "voucher"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
