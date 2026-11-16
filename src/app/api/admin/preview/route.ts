import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/session";

// Turns on draft mode for the admin so unpublished page edits render on the
// real storefront, then sends them to the page.
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  // Same-site paths only, so this can't be used as an open redirect.
  const target = path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
  (await draftMode()).enable();
  redirect(target);
}
