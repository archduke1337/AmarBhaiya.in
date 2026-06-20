"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";

import { updateUserRoleFormAction } from "@/actions/form-wrappers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

const selectClassName =
  "h-10 flex-1 rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3 text-xs font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

export function UsersTable({ users }: { users: UserItem[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of users) {
      counts[u.role] = (counts[u.role] || 0) + 1;
    }
    return counts;
  }, [users]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search and filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-surface border-border/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {["all", "student", "instructor", "moderator", "admin"].map(
              (role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    roleFilter === role
                      ? "bg-foreground text-background border-foreground"
                      : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {role === "all" ? "All" : role}
                  <span className="tabular-nums">
                    {role === "all" ? users.length : roleCounts[role] || 0}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      {(search || roleFilter !== "all") && (
        <p className="text-xs font-semibold text-muted-foreground tabular-nums">
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      {/* User list */}
      <div className="bg-surface border border-border/40 rounded-2xl overflow-hidden">
        <div className="hidden items-center gap-4 border-b border-border/40 bg-surface-hover px-5 py-3 font-heading text-xs font-black uppercase tracking-[0.15em] text-muted-foreground md:grid md:grid-cols-[1fr_1fr_120px_100px_190px]">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Assign Role</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm font-semibold text-muted-foreground">
            No users match your search or filter.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((user) => (
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
                <p className="hidden text-sm font-medium text-muted-foreground md:block truncate">
                  {user.email}
                </p>
                <Badge variant="outline" className="w-fit capitalize">
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

                <form action={updateUserRoleFormAction} className="flex items-center gap-2">
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
                  <Button type="submit" variant="secondary" size="xs">
                    Set
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
