import { requireRole } from "@/server/appwrite/auth";

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "moderator"]);
  return children;
}
