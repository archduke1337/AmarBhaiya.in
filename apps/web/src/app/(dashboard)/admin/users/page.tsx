import { Users } from "lucide-react";

import { getAdminUsers } from "@/server/appwrite/dashboard-data";
import { PageHeader, EmptyState, StatGrid, StatCard } from "@/components/dashboard";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  const roleCounts = {
    admin: users.filter((u) => u.role === "admin").length,
    instructor: users.filter((u) => u.role === "instructor").length,
    moderator: users.filter((u) => u.role === "moderator").length,
    student: users.filter((u) => u.role === "student").length,
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin · Users"
        title="User Management"
        description={`${users.length} registered users across admins, instructors, moderators, and students. Change roles carefully because this controls what each person can access.`}
      />

      {/* Role breakdown stats */}
      <StatGrid columns={4}>
        <StatCard label="Admins" value={roleCounts.admin} description="Full platform access" />
        <StatCard label="Instructors" value={roleCounts.instructor} description="Course creators" />
        <StatCard label="Moderators" value={roleCounts.moderator} description="Community managers" />
        <StatCard label="Students" value={roleCounts.student} description="Learners" />
      </StatGrid>

      {/* User list */}
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Users will appear here once they register on the platform."
        />
      ) : (
        <UsersTable users={users} />
      )}
    </div>
  );
}
