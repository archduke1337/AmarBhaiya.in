const ACTIONS = [
  "Warn user",
  "Mute user",
  "Timeout user",
  "Delete post",
  "Pin or unpin thread",
  "Flag for admin review",
];

export default function ModeratorCommunityPage() {
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
          {ACTIONS.map((action) => (
            <li key={action} className="border border-border px-3 py-2">
              {action}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
