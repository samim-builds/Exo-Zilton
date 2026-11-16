"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { SETTINGS_TAG } from "@/lib/cms/server";
import { SETTING_KEYS, settingSchemas, type SettingKey } from "@/lib/cms/settings";

export const saveSetting = adminAction(
  z.object({ key: z.enum(SETTING_KEYS as [SettingKey, ...SettingKey[]]), value: z.unknown() }),
  async ({ key, value }) => {
    const parsed = settingSchemas[key].safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new AdminActionError(`${issue?.path.join(" › ") || key}: ${issue?.message ?? "invalid"}`);
    }
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: parsed.data },
      update: { value: parsed.data },
    });
    await logActivity({ entityType: "setting", entityId: key, action: "UPDATE", summary: `Updated ${key} settings` });
    return { key };
  },
  { tags: [SETTINGS_TAG], paths: ["/admin/settings"], site: true },
);
