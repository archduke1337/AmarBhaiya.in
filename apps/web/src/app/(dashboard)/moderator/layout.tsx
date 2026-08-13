import { requireRole } from "@/lib/appwrite/auth";

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "moderator"]);
  return children;
}
