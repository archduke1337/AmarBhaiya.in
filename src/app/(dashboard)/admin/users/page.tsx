const USERS = [
  { name: "Aman", role: "student", status: "active" },
  { name: "Nisha", role: "instructor", status: "active" },
  { name: "Rohit", role: "moderator", status: "suspended" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Users</p>
        <h1 className="text-3xl mt-2">User Management</h1>
      </div>

      <section className="space-y-3">
        {USERS.map((user) => (
          <article key={user.name} className="border border-border p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg">{user.name}</h2>
              <p className="text-sm text-muted-foreground">Role: {user.role}</p>
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{user.status}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
