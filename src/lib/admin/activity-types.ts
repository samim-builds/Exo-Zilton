// Client-safe: activity.ts reads request headers and the database.
export const ACTIVITY_ACTIONS = ["CREATE", "UPDATE", "DELETE", "PUBLISH", "STATUS"] as const;
