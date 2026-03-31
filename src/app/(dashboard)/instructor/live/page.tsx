export default function InstructorLivePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live Sessions</p>
        <h1 className="text-3xl mt-2">Schedule and Broadcast</h1>
      </div>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Upcoming</h2>
        <p className="text-sm text-muted-foreground">
          Saturday 7:00 PM - Coding Q&A Sprint (120 RSVPs)
        </p>
      </section>

      <section className="border border-border p-6 space-y-4">
        <h2 className="text-xl">Start a new live session</h2>
        <form className="space-y-3">
          <input className="w-full h-11 border border-border bg-background px-3" placeholder="Session title" />
          <input className="w-full h-11 border border-border bg-background px-3" placeholder="Schedule (ISO or local date time)" />
          <button className="h-10 px-4 bg-foreground text-background text-sm" type="submit">Create session</button>
        </form>
      </section>
    </div>
  );
}
