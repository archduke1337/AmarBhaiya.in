import { User, Calendar, MapPin, GraduationCap, Phone } from "lucide-react";
import { Query } from "node-appwrite";

import { requireRole } from "@/lib/appwrite/auth";
import { APPWRITE_CONFIG } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { PageHeader, EmptyState } from "@/components/dashboard";

type AnyRow = Record<string, unknown> & { $id: string };

async function getAllStudentProfiles() {
  const { tablesDB } = await createAdminClient();
  try {
    const result = await tablesDB.listRows({
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tables.studentProfiles,
      queries: [Query.limit(200), Query.orderDesc("$createdAt")],
    });
    return result.rows as AnyRow[];
  } catch {
    return [];
  }
}

export default async function AdminStudentProfilesPage() {
  await requireRole(["admin"]);
  const profiles = await getAllStudentProfiles();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Student Data"
        title="Student Profiles"
        description={`${profiles.length} students have filled their profile information.`}
      />

      {profiles.length === 0 ? (
        <EmptyState
          icon={User}
          title="No student profiles yet"
          description="Students will appear here once they fill out their personal information from their dashboard."
        />
      ) : (
        <section className="border border-border">
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_100px_150px_100px_100px]">
            <span>User ID</span>
            <span>Grade</span>
            <span>School</span>
            <span>City</span>
            <span>DOB</span>
          </div>

          <div className="divide-y divide-border">
            {profiles.map((profile) => (
              <div
                key={profile.$id}
                className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-[1fr_100px_150px_100px_100px] md:items-center md:gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs">
                    {String(profile.userId ?? "")}
                  </span>
                  {typeof profile.guardianName === "string" && profile.guardianName.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Guardian: {profile.guardianName}
                    </span>
                  )}
                </div>

                <span className="text-sm">
                  {String(profile.grade ?? "—")}
                </span>

                <span className="text-sm text-muted-foreground line-clamp-1">
                  {String(profile.school ?? "—")}
                </span>

                <span className="text-sm text-muted-foreground">
                  {String(profile.city ?? "—")}
                </span>

                <span className="text-xs tabular-nums text-muted-foreground">
                  {String(profile.dateOfBirth ?? "—")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
