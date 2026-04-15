import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/appwrite/actions";
import { MobileSidebar } from "@/components/layout/sidebar";
import type { Role } from "@/lib/utils/constants";

type DashboardHeaderProps = {
  userName: string;
  userEmail: string;
  role: Role;
  userId: string;
};

export function DashboardHeader({
  userName,
  userEmail,
  role,
  userId,
}: DashboardHeaderProps) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  const eyebrow = role === "student" ? "Study space" : "Dashboard";
  const helperText =
    role === "student"
      ? "Aaj ka flow simple rakho: continue, revise, phir next step."
      : userEmail;

  return (
    <header className="sticky top-0 z-20 bg-background px-4 py-3 md:px-6">
      <div className="retro-surface flex flex-col gap-4 bg-card px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5 md:py-4">
        <div className="flex items-center gap-4">
          <MobileSidebar role={role} userId={userId} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl">{firstName}</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">{role}</Badge>
            </div>
            <p className="max-w-[32rem] text-sm font-medium text-muted-foreground">
              <span className="md:hidden">{helperText}</span>
              <span className="hidden md:inline">{userEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action={logoutAction} className="hidden sm:block">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
