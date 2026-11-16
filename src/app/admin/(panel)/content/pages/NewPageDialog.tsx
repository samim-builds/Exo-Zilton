"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/form/Field";
import { slugifyOptionValue as slugify } from "@/lib/catalog/variants";
import { createPage } from "./actions";

export function NewPageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await createPage({ title, slug });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      setOpen(false);
      router.push(`/admin/content/pages/${res.data.slug}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New page</DialogTitle>
          <DialogDescription>It starts as a draft. Add sections, preview, then publish.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Address" error={errors.slug}>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                value={slug}
                className="font-mono"
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !title || !slug}>
            {pending && <Loader2 className="animate-spin" />}
            Create page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
