"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldEditor } from "@/components/admin/cms/FieldEditor";
import { SETTING_GROUPS } from "@/lib/cms/settings-fields";
import { SETTING_KEYS, type SettingKey, type SiteSettings } from "@/lib/cms/settings";
import { saveSetting } from "./actions";

function GroupForm({ group, initial }: { group: SettingKey; initial: Record<string, unknown> }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const def = SETTING_GROUPS[group];

  function save() {
    start(async () => {
      const res = await saveSetting({ key: group, value });
      if (!res.ok) return void toast.error(res.error);
      setDirty(false);
      toast.success(`${def.label} saved`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{def.label}</CardTitle>
        <CardDescription>{def.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldEditor
          fields={def.fields}
          value={value}
          onChange={(next) => {
            setValue(next);
            setDirty(true);
          }}
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={pending || !dirty}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsForm({ settings, initialTab }: { settings: SiteSettings; initialTab: SettingKey }) {
  return (
    <Tabs defaultValue={initialTab}>
      <TabsList className="mb-4 flex-wrap">
        {SETTING_KEYS.map((key) => (
          <TabsTrigger key={key} value={key}>
            {SETTING_GROUPS[key].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SETTING_KEYS.map((key) => (
        <TabsContent key={key} value={key} className="max-w-3xl">
          <GroupForm group={key} initial={settings[key] as Record<string, unknown>} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
