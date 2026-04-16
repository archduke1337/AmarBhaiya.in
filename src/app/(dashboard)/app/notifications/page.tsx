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
import { Button } from "@/components/ui/button";
import { RetroPanel } from "@/components/marketing/retro-panel";

export default async function NotificationsPage() {
  await requireAuth();
  const notifications = await getUserNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Notifications"
          title="Updates jo padhai ke flow ko affect karte hain."
          description={
            unreadCount > 0
              ? `${unreadCount} unread update${unreadCount !== 1 ? "s" : ""}. Pehle feedback, quiz result, ya instructor update check kar lo.`
              : "Inbox clear hai. Ab lesson ya notes par wapas ja sakte ho."
          }
        />
        {unreadCount > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button
              type="submit"
              variant="outline"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Abhi koi update nahi hai. Jab instructor, admin, ya system kuch important bhejega, woh yahin dikhega."
        />
      ) : (
        <RetroPanel tone="card" className="space-y-0 p-0">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              id={`notification-${notification.id}`}
              className={`flex scroll-mt-24 flex-col gap-4 border-b-2 border-border px-5 py-4 transition-colors last:border-b-0 sm:flex-row sm:items-start ${
                notification.isRead
                  ? "opacity-70"
                  : "bg-[color:var(--surface-secondary)]"
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

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {notification.createdAt && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                  <Button
                    type="submit"
                    variant="outline"
                    size="xs"
                    title="Mark as read"
                  >
                    Mark read
                  </Button>
                </form>
              )}
            </article>
          ))}
        </RetroPanel>
      )}
    </div>
  );
}
