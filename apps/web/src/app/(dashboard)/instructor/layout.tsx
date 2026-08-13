import { requireRole } from "@/lib/appwrite/auth";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin", "instructor"]);
  return children;
}
