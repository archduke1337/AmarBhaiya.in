/**
 * dashboard-data/index.ts
 * ────────────────────────
 * Public barrel for the dashboard data layer.
 *
 * The original dashboard-data.ts was a 3300-line monolith.
 * This index re-exports everything from it so all existing
 * `import { ... } from "@/lib/appwrite/dashboard-data"` paths
 * continue to work without any changes.
 *
 * TODO: progressively move domain functions into their own
 * sub-modules here as they are touched:
 *   - instructor.ts   (getInstructor*)
 *   - admin.ts        (getAdmin*)
 *   - moderator.ts    (getModerator*)
 *   - student.ts      (getStudent*, getCommunity*)
 */
export * from "@/lib/appwrite/dashboard-data";
