import { Send, Megaphone } from "lucide-react";

import { requireRole } from "@/lib/appwrite/auth";
import { getAdminUsers } from "@/lib/appwrite/dashboard-data";
import {
  sendNotificationAction,
  broadcastNotificationAction,
} from "@/actions/notifications";
import { PageHeader } from "@/components/dashboard";
import { formatAdminUserOption } from "@/lib/utils/admin-select";

export default async function AdminNotificationsPage() {
  await requireRole(["admin"]);
  const users = await getAdminUsers();
  const directMessageUsers = [...users].sort((left, right) => left.name.localeCompare(right.name));

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <PageHeader
        eyebrow="Admin · Notifications"
        title="Notification Center"
        description="Send targeted notifications to specific users or broadcast announcements to all platform users."
      />

      {/* Send to specific user */}
      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Send className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Send to User</h2>
        </div>

        <form
          action={sendNotificationAction}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">User</span>
            <select
              name="userId"
              required
              disabled={directMessageUsers.length === 0}
              defaultValue=""
              className="h-10 border border-border bg-background px-3 text-sm disabled:opacity-60"
            >
              <option value="" disabled>
                {directMessageUsers.length > 0 ? "Select user" : "No users available"}
              </option>
              {directMessageUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {formatAdminUserOption(user)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Type</span>
            <select
              name="type"
              className="h-10 border border-border bg-background px-3 text-sm"
            >
              <option value="info">Info</option>
              <option value="course">Course</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
              <option value="announcement">Announcement</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Title</span>
            <input
              name="title"
              required
              minLength={3}
              placeholder="Notification title"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Body (optional)</span>
            <textarea
              name="body"
              rows={3}
              placeholder="Additional message..."
              className="border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Link (optional)</span>
            <input
              name="link"
              placeholder="/app/dashboard"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={directMessageUsers.length === 0}
              className="h-10 bg-foreground px-6 text-sm text-background transition-opacity hover:opacity-90"
            >
              Send Notification
            </button>
          </div>
        </form>
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {directMessageUsers.length > 0
            ? `${directMessageUsers.length} users are available for targeted notifications.`
            : "No users are available for targeted notifications yet."}
        </div>
      </section>

      {/* Broadcast to all users */}
      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Megaphone className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Broadcast to All Users</h2>
        </div>

        <form
          action={broadcastNotificationAction}
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Type</span>
            <select
              name="type"
              className="h-10 border border-border bg-background px-3 text-sm"
            >
              <option value="announcement">Announcement</option>
              <option value="system">System Update</option>
              <option value="course">New Course</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Link (optional)</span>
            <input
              name="link"
              placeholder="/courses"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Title</span>
            <input
              name="title"
              required
              minLength={3}
              placeholder="Announcement title"
              className="h-10 border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
            <span className="text-muted-foreground">Body (optional)</span>
            <textarea
              name="body"
              rows={3}
              placeholder="Broadcast message..."
              className="border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end md:col-span-2 justify-end">
            <button
              type="submit"
              className="h-10 bg-foreground px-6 text-sm text-background transition-opacity hover:opacity-90"
            >
              Broadcast to All Users
            </button>
          </div>
        </form>
      </section>

      {/* Info */}
      <div className="border border-amber-500/30 bg-amber-500/5 px-5 py-3 text-sm">
        <p className="font-medium">Note</p>
        <p className="text-xs text-muted-foreground mt-1">
          Broadcasts create one notification per user. For large user bases,
          this may take a moment. Notifications appear in each user&apos;s
          notification feed under Dashboard → Notifications.
        </p>
      </div>
    </div>
  );
}
