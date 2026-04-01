import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

import { requireAuth } from "@/lib/appwrite/auth";
import {
  getUserNotifications,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notifications";
import { formatRelativeTime } from "@/lib/utils/format";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

export default async function NotificationsPage() {
  const user = await requireAuth();
  const notifications = await getUserNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <PageHeader
          eyebrow="Notifications"
          title="Your Notifications"
          description={
            unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You\u2019re all caught up!"
          }
        />
        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-9 border border-border px-3 text-xs transition-colors hover:bg-muted"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You don't have any notifications yet. They'll appear here when instructors, admins, or the system send you updates."
        />
      ) : (
        <div className="flex flex-col">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`flex items-start gap-4 border-b border-border px-5 py-4 transition-colors ${
                notification.isRead ? "opacity-60" : "bg-muted/20"
              }`}
            >
              {/* Unread dot */}
              <div className="mt-1.5 shrink-0">
                {notification.isRead ? (
                  <div className="size-2" />
                ) : (
                  <div className="size-2 rounded-full bg-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-medium truncate">
                    {notification.title}
                  </h3>
                  <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                    {notification.type}
                  </Badge>
                </div>

                {notification.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.body}
                  </p>
                )}

                <div className="mt-1.5 flex items-center gap-3">
                  {notification.createdAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  )}

                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="size-3" />
                      View
                    </Link>
                  )}
                </div>
              </div>

              {/* Mark as read */}
              {!notification.isRead && (
                <form action={markNotificationReadAction} className="shrink-0">
                  <input
                    type="hidden"
                    name="notificationId"
                    value={notification.id}
                  />
                  <button
                    type="submit"
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
