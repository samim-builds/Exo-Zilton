import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/session";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// Thrown from a handler to show a specific message to the admin.
export class AdminActionError extends Error {}

type Revalidate<I, T> = {
  tags?: string[] | ((input: I, result: T) => string[]);
  paths?: string[] | ((input: I, result: T) => string[]);
  /** Revalidate every storefront page (catalog, settings and content changes). */
  site?: boolean;
};

/**
 * Wraps an admin Server Action: verifies the session, validates input with
 * zod, runs the handler, then refreshes the cache tags and paths it touched.
 * Handlers log their own activity (see logActivity) since they know the entity.
 */
export function adminAction<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.infer<S>) => Promise<T>,
  revalidate: Revalidate<z.infer<S>, T> = {},
) {
  return async (raw: z.input<S>): Promise<ActionResult<T>> => {
    if (!(await isAdminAuthenticated())) {
      return { ok: false, error: "Your session has expired. Please log in again." };
    }
    if (!process.env.DATABASE_URL) {
      return { ok: false, error: "Database not configured. Set DATABASE_URL and run migrations." };
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please fix the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      };
    }

    let result: T;
    try {
      result = await handler(parsed.data);
    } catch (error) {
      if (error instanceof AdminActionError) {
        return { ok: false, error: error.message };
      }
      console.error(error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }

    const resolve = (v: Revalidate<z.infer<S>, T>["tags"]) =>
      typeof v === "function" ? v(parsed.data, result) : (v ?? []);
    for (const tag of resolve(revalidate.tags)) updateTag(tag);
    for (const path of resolve(revalidate.paths)) revalidatePath(path);
    if (revalidate.site) revalidatePath("/", "layout");

    return { ok: true, data: result };
  };
}
