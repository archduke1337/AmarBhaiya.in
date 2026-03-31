import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/lib/appwrite/actions";
import type { Role } from "@/lib/utils/constants";

type DashboardHeaderProps = {
  userName: string;
  userEmail: string;
  role: Role;
};

export function DashboardHeader({
  userName,
  userEmail,
  role,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur px-6 md:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Dashboard
          </p>
          <h1 className="text-lg mt-1">{userName}</h1>
          <p className="text-sm text-muted-foreground">
            {userEmail} - {role}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action={logoutAction}>
            <button
              type="submit"
              className="h-8 px-3 border border-border text-xs uppercase tracking-widest cursor-pointer hover:bg-accent"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
