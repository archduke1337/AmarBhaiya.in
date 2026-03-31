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
          This panel consolidates high-frequency moderation actions. Detailed
          audit and reversal workflows will be expanded in dedicated actions.
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
          <article key={thread.id} className="border border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {thread.category}
              {thread.pinned ? " · pinned" : ""}
            </p>
            <h3>{thread.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {thread.author} · {thread.replies} replies
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
