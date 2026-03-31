export default function InstructorNewCoursePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Create Course</p>
        <h1 className="text-3xl mt-2">Course Creation Wizard</h1>
      </div>

      <form className="border border-border p-6 space-y-4">
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Course title</span>
          <input className="w-full h-11 border border-border bg-background px-3" placeholder="Enter course title" />
        </label>
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Category</span>
          <input className="w-full h-11 border border-border bg-background px-3" placeholder="tech / academics / fitness / career" />
        </label>
        <label className="space-y-2 block text-sm">
          <span className="text-muted-foreground">Short description</span>
          <textarea className="w-full min-h-28 border border-border bg-background px-3 py-2" placeholder="What outcomes will students get?" />
        </label>
        <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">Save draft</button>
      </form>
    </div>
  );
}
