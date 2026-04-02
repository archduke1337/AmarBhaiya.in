import { Users } from "lucide-react";

import { getAdminUsers } from "@/lib/appwrite/dashboard-data";
import { updateUserRoleAction } from "@/actions/operations";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

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
        description={`${users.length} registered users — ${roleCounts.admin} admins, ${roleCounts.instructor} instructors, ${roleCounts.moderator} moderators, ${roleCounts.student} students`}
      />

      {/* Role breakdown */}
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div
            key={role}
            className="flex items-center justify-between border border-border px-4 py-3"
          >
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {role}
            </span>
            <span className="text-lg font-medium tabular-nums">{count}</span>
          </div>
        ))}
      </div>

      {/* User list */}
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Users will appear here once they register on the platform."
        />
      ) : (
        <section className="border border-border">
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-border bg-muted/30 px-5 py-3 text-xs uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_120px_100px_160px]">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Assign Role</span>
          </div>

          {/* User rows */}
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[1fr_1fr_120px_100px_160px] md:items-center md:gap-4"
              >
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground md:hidden">
                    {user.email}
                  </p>
                </div>
                <p className="hidden text-sm text-muted-foreground md:block">
                  {user.email}
                </p>
                <Badge variant="outline" className="w-fit">
                  {user.role}
                </Badge>
                <span
                  className={`text-xs uppercase tracking-wider ${
                    user.status === "active"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {user.status}
                </span>

                {/* Role change form */}
                <form
                  action={updateUserRoleAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="h-8 flex-1 border border-border bg-background px-2 text-xs"
                  >
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="h-8 border border-border px-3 text-xs transition-colors hover:bg-muted"
                  >
                    Set
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
