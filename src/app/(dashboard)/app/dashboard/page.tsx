import { requireAuth } from "@/lib/appwrite/auth";
import { getUserRole } from "@/lib/appwrite/auth";
import { logoutAction } from "@/lib/appwrite/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireAuth();
  const role = getUserRole(user);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Dashboard
          </p>
          <h1 className="text-4xl mb-1">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Signed in as{" "}
            <span className="text-foreground">{user.email}</span>
            {" · "}
            <span className="border border-border px-2 py-0.5 text-xs uppercase tracking-wider">
              {role}
            </span>
          </p>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "User ID", value: user.$id },
            { label: "Role", value: role },
            { label: "Verified", value: user.emailVerification ? "Yes" : "No" },
          ].map((item) => (
            <div key={item.label} className="border border-border p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                {item.label}
              </p>
              <p className="text-sm font-mono truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Logout */}
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            className="border-border hover:bg-card transition-colors cursor-pointer"
          >
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
