import { Users } from "lucide-react";

import { getAdminUsers } from "@/lib/appwrite/dashboard-data";
import { updateUserRoleFormAction } from "@/actions/form-wrappers";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const selectClassName =
  "h-10 flex-1 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 text-xs font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

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

      {/* Role breakdown */}
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div
            key={role}
            className="bg-surface border border-border/40 rounded-2xl flex items-center justify-between p-4"
          >
            <span className="font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
              {role}
            </span>
            <span className="text-2xl tabular-nums">{count}</span>
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
        <div className="bg-surface border border-border/40 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_120px_100px_190px]">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Assign Role</span>
          </div>

          {/* User rows */}
          <div className="divide-y divide-border/40">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/30 md:grid md:grid-cols-[1fr_1fr_120px_100px_190px] md:items-center md:gap-4"
              >
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs font-medium text-muted-foreground md:hidden">
                    {user.email}
                  </p>
                </div>
                <p className="hidden text-sm font-medium text-muted-foreground md:block">
                  {user.email}
                </p>
                <Badge variant="outline" className="w-fit">
                  {user.role}
                </Badge>
                <span
                  className={`font-heading text-xs font-black uppercase tracking-wider ${
                    user.status === "active"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {user.status}
                </span>

                {/* Role change form */}
                <form
                  action={updateUserRoleFormAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className={selectClassName}
                  >
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="xs"
                  >
                    Set
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
