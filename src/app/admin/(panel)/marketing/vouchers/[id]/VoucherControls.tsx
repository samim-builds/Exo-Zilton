"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/admin/form/Field";
import { adjustVoucher, setVouchersActive } from "../actions";

export function VoucherControls({ id, active, currency }: { id: string; active: boolean; currency: string }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function adjust() {
    start(async () => {
      const res = await adjustVoucher({ id, delta: Math.round(Number(delta)) || 0, note });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      setErrors({});
      setDelta("");
      setNote("");
      toast.success("Balance updated");
      router.refresh();
    });
  }

  function toggle(next: boolean) {
    start(async () => {
      const res = await setVouchersActive({ ids: [id], active: next });
      if (!res.ok) return void toast.error(res.error);
      toast.success(next ? "Voucher reactivated" : "Voucher deactivated");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          Can be used at checkout
          <Switch checked={active} disabled={pending} onCheckedChange={toggle} />
        </label>
        <Field label={`Adjust balance (${currency}, use - to deduct)`} error={errors.delta}>
          <Input type="number" value={delta} placeholder="500 or -500" onChange={(e) => setDelta(e.target.value)} />
        </Field>
        <Field label="Reason" error={errors.note}>
          <Input value={note} placeholder="Goodwill top-up" onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button onClick={adjust} disabled={pending || !delta} className="w-full">
          {pending && <Loader2 className="animate-spin" />}
          Adjust balance
        </Button>
      </CardContent>
    </Card>
  );
}
