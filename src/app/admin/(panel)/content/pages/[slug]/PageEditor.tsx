"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form/Field";
import { FieldEditor } from "@/components/admin/cms/FieldEditor";
import { cn } from "@/lib/utils";
import type { PageForEdit } from "@/lib/cms/admin-queries";
import { SECTION_TYPES, sectionDefaults, type SectionInstance, type SectionType } from "@/lib/cms/sections";
import { deletePage, discardPageDraft, publishPage, savePageDraft, setPageStatus } from "../actions";

const newId = () => `s-${Math.random().toString(36).slice(2, 10)}`;

function sectionSummary(section: SectionInstance): string {
  const d = section.data as Record<string, unknown>;
  const text = [d.title, d.heading, d.eyebrow].find((v) => typeof v === "string" && v.trim());
  return typeof text === "string" ? text : "";
}

export function PageEditor({ page, path }: { page: PageForEdit; path: string }) {
  const router = useRouter();
  const [meta, setMeta] = useState({
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    ogImageUrl: page.ogImageUrl,
  });
  const [sections, setSections] = useState(page.sections);
  const [selectedId, setSelectedId] = useState(page.sections[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  function updateSections(next: SectionInstance[]) {
    setSections(next);
    setDirty(true);
  }

  function updateMeta(key: keyof typeof meta, value: string) {
    setMeta((m) => ({ ...m, [key]: value }));
    setDirty(true);
  }

  function addSection(type: SectionType) {
    const section = { id: newId(), type, visible: true, data: sectionDefaults(type) } as SectionInstance;
    const at = selected ? sections.indexOf(selected) + 1 : sections.length;
    updateSections([...sections.slice(0, at), section, ...sections.slice(at)]);
    setSelectedId(section.id);
  }

  function moveSection(index: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [s] = next.splice(index, 1);
    next.splice(to, 0, s);
    updateSections(next);
  }

  function duplicateSection(index: number) {
    const copy = { ...structuredClone(sections[index]), id: newId() };
    updateSections([...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)]);
    setSelectedId(copy.id);
  }

  function removeSection(index: number) {
    const next = sections.filter((_, i) => i !== index);
    updateSections(next);
    if (sections[index].id === selectedId) setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null);
  }

  const payload = () => ({ slug: page.slug, ...meta, sections });

  function save(kind: "draft" | "publish" | "preview") {
    start(async () => {
      const res = kind === "publish" ? await publishPage(payload()) : await savePageDraft(payload());
      if (!res.ok) return void toast.error(res.error);
      setDirty(false);
      if (kind === "preview") {
        window.open(`/api/admin/preview?path=${encodeURIComponent(path)}`, "_blank", "noopener");
      } else {
        toast.success(kind === "publish" ? "Published — the live page is updated" : "Draft saved");
      }
      router.refresh();
    });
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) {
    start(async () => {
      const res = await action();
      if (!res.ok) return void toast.error(res.error ?? "Something went wrong.");
      toast.success(success);
      if (after) after();
      else router.refresh();
    });
  }

  const statusBadge =
    page.status === "PUBLISHED" ? (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
        Published
      </Badge>
    ) : page.status === "DEFAULT" ? (
      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800">
        Live (original content)
      </Badge>
    ) : (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        Draft — not visible on the site
      </Badge>
    );

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-navy">{meta.title || "Untitled"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {statusBadge}
            {(page.hasDraft || dirty) && <Badge variant="outline">{dirty ? "Unsaved changes" : "Unpublished draft"}</Badge>}
            <span className="font-mono">{path}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => save("preview")} disabled={pending}>
            <Eye />
            Preview
          </Button>
          <Button variant="outline" onClick={() => save("draft")} disabled={pending || !dirty}>
            Save draft
          </Button>
          <Button onClick={() => save("publish")} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {page.isSystem || page.status === "PUBLISHED" ? "Publish" : "Save & publish"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!page.hasDraft}
                onSelect={() => run(() => discardPageDraft({ slug: page.slug }), "Draft discarded", () => window.location.reload())}
              >
                Discard unpublished changes
              </DropdownMenuItem>
              {!page.isSystem && page.status === "PUBLISHED" && (
                <DropdownMenuItem onSelect={() => run(() => setPageStatus({ slug: page.slug, status: "DRAFT" }), "Page unpublished")}>
                  Unpublish page
                </DropdownMenuItem>
              )}
              {!page.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() =>
                      run(() => deletePage({ slug: page.slug }), "Page deleted", () => {
                        setDirty(false);
                        router.push("/admin/content/pages");
                      })
                    }
                  >
                    Delete page
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.length === 0 && <p className="text-sm text-muted-foreground">No sections yet. Add one below.</p>}
              {sections.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm",
                    s.id === selectedId ? "border-navy bg-navy/5" : "hover:bg-muted/50",
                    !s.visible && "opacity-60",
                  )}
                >
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedId(s.id)}>
                    <span className="block truncate font-medium">{SECTION_TYPES[s.type].label}</span>
                    {sectionSummary(s) && <span className="block truncate text-xs text-muted-foreground">{sectionSummary(s)}</span>}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={s.visible ? "Hide section" : "Show section"}
                    onClick={() => updateSections(sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)))}
                  >
                    {s.visible ? <Eye /> : <EyeOff />}
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={i === 0} onClick={() => moveSection(i, i - 1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Move down" disabled={i === sections.length - 1} onClick={() => moveSection(i, i + 1)}>
                    <ArrowDown />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs" aria-label="Section actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => duplicateSection(i)}>
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => removeSection(i)}>
                        <Trash2 />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Select value="" onValueChange={(v) => addSection(v as SectionType)}>
                <SelectTrigger className="mt-2 w-full">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="size-4" />
                    <SelectValue placeholder="Add section" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SECTION_TYPES) as SectionType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {SECTION_TYPES[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Title (admin and browser tab)">
                <Input value={meta.title} onChange={(e) => updateMeta("title", e.target.value)} />
              </Field>
              <Field label="SEO title">
                <Input value={meta.seoTitle} placeholder={meta.title} onChange={(e) => updateMeta("seoTitle", e.target.value)} />
              </Field>
              <Field label="SEO description">
                <Textarea rows={3} value={meta.seoDescription} onChange={(e) => updateMeta("seoDescription", e.target.value)} />
                <p className="text-xs text-muted-foreground">{meta.seoDescription.length}/160 recommended</p>
              </Field>
              <Field label="Social share image URL (optional)">
                <Input value={meta.ogImageUrl} onChange={(e) => updateMeta("ogImageUrl", e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </div>

        <Card className="self-start">
          {selected ? (
            <>
              <CardHeader>
                <CardTitle className="text-base">{SECTION_TYPES[selected.type].label}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Use {"{{siteName}}"}, {"{{contactEmail}}"}, {"{{location}}"} or {"{{foundingYear}}"} to insert values from Settings.
                </p>
              </CardHeader>
              <CardContent>
                <FieldEditor
                  key={selected.id}
                  fields={SECTION_TYPES[selected.type].fields}
                  value={selected.data as Record<string, unknown>}
                  onChange={(data) => updateSections(sections.map((s) => (s.id === selected.id ? ({ ...s, data } as SectionInstance) : s)))}
                />
              </CardContent>
            </>
          ) : (
            <CardContent className="py-16 text-center text-sm text-muted-foreground">Select a section to edit it.</CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
