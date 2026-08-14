export * from "./dashboard-data/internal";
export * from "./dashboard-data/student";
export * from "./dashboard-data/community";
export * from "./dashboard-data/instructor";
export * from "./dashboard-data/moderator";
export * from "./dashboard-data/public";
// Re-export admin types and functions (admin.ts defines its own AdminCourseItem which supersedes internal.ts)
export type { AdminCourseItem } from "./dashboard-data/admin";
export {
  getAdminDashboardStats,
  getAdminUsers,
  getAdminCourses,
  getAdminCategories,
  getAdminPayments,
  getAdminLiveData,
  getAdminModerationData,
  getAdminAuditLogs,
} from "./dashboard-data/admin";
