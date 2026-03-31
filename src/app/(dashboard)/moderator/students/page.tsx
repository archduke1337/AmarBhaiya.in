import { getModeratorStudents } from "@/lib/appwrite/dashboard-data";

export default async function ModeratorStudentsPage() {
  const students = await getModeratorStudents();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Students</p>
        <h1 className="text-3xl mt-2">Student Activity Lookup</h1>
      </div>

      <section className="space-y-3">
        {students.length === 0 ? (
          <article className="border border-border p-5 text-sm text-muted-foreground">
            No student moderation activity found yet.
          </article>
        ) : null}

        {students.map((student) => (
          <article key={student.id} className="border border-border p-5">
            <h2 className="text-lg">{student.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">ID: {student.id}</p>
            <p className="text-sm text-muted-foreground mt-1">Action: {student.latestAction}</p>
            <p className="text-sm text-muted-foreground mt-1">Reason: {student.latestReason}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
              {student.status}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
