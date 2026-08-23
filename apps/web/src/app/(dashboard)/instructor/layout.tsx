import { requireRole } from "@/server/appwrite/auth";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "instructor"]);
  return children;
}
