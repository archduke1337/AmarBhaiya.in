import { applyModerationActionAction } from "@/actions/operations";
import { getModeratorCommunityData } from "@/lib/appwrite/dashboard-data";

export default async function ModeratorCommunityPage() {
  const data = await getModeratorCommunityData();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Community Moderation</p>
        <h1 className="text-3xl mt-2">Tools and Actions</h1>
      </div>

      <section className="border border-border p-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          This panel consolidates high-frequency moderation workflows directly
          on community content and keeps action totals visible for the team.
        </p>
        <ul className="space-y-2 text-sm">
          {data.actionCounts.map((action) => (
            <li key={action.label} className="border border-border px-3 py-2 flex items-center justify-between">
              <span>{action.label}</span>
              <span className="text-muted-foreground">{action.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-border p-6 space-y-3">
        <h2 className="text-xl">Recent community threads</h2>
        {data.recentThreads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No threads available yet.</p>
        ) : null}
        {data.recentThreads.map((thread) => (
          <article key={thread.id} className="border border-border p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {thread.category}
              {thread.pinned ? " · pinned" : ""}
            </p>
            <h3>{thread.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {thread.author} · {thread.replies} replies
            </p>

            {thread.authorId ? (
              <form action={applyModerationActionAction} className="border border-border p-3 grid gap-3 md:grid-cols-3">
                <input type="hidden" name="targetUserId" value={thread.authorId} />
                <input type="hidden" name="targetUserName" value={thread.author} />
                <input type="hidden" name="scope" value="platform" />
                <input type="hidden" name="entityType" value="forum_thread" />
                <input type="hidden" name="entityId" value={thread.id} />

                <label className="space-y-1 text-sm">
                  <span>Action</span>
                  <select
                    name="action"
                    defaultValue={thread.pinned ? "unpin" : "pin"}
                    className="h-10 w-full border border-border bg-background px-3"
                  >
                    <option value="pin">Pin thread</option>
                    <option value="unpin">Unpin thread</option>
                    <option value="flag">Flag thread</option>
                    <option value="delete_post">Delete post</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Duration (optional)</span>
                  <input
                    name="duration"
                    placeholder="24h"
                    className="h-10 w-full border border-border bg-background px-3"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-3">
                  <span>Reason</span>
                  <textarea
                    name="reason"
                    required
                    minLength={3}
                    defaultValue={`Thread moderation: ${thread.title}`}
                    rows={2}
                    className="w-full border border-border bg-background px-3 py-2"
                  />
                </label>

                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="h-9 px-3 border border-border text-sm hover:bg-muted"
                  >
                    Apply thread action
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground border border-border p-3">
                Author ID unavailable for this thread, so direct user actions are disabled.
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
