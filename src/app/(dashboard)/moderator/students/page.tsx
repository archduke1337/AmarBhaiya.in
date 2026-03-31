const STUDENTS = [
  { id: "usr-101", name: "Aanya", notes: "2 warnings in last 30 days" },
  { id: "usr-244", name: "Dev", notes: "Clean activity" },
  { id: "usr-377", name: "Mihir", notes: "Timeout expired, monitor" },
];

export default function ModeratorStudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</p>
        <h1 className="text-3xl mt-2">Student Activity Lookup</h1>
      </div>

      <section className="space-y-3">
        {STUDENTS.map((student) => (
          <article key={student.id} className="border border-border p-5">
            <h2 className="text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">ID: {student.id}</p>
            <p className="text-sm text-muted-foreground mt-1">{student.notes}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
