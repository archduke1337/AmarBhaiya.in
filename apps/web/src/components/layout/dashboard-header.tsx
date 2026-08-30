import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/appwrite/actions";
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
      ? "Aaj ka flow simple rakho: continue, waive, phir next step."
      : userEmail;

  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 pt-safe backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
        <div className="flex items-center gap-4">
          <MobileSidebar role={role} userId={userId} />
          
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="eyebrow self-start">
              {eyebrow}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-heading text-[clamp(1.5rem,3vw,2rem)] font-normal leading-tight tracking-[-0.02em]" aria-label={`Welcome, ${firstName}`}>{firstName}</p>
              <div aria-hidden="true" className="hidden items-center rounded-full border border-border/60 bg-surface px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-foreground/70 sm:flex">
                {role}
              </div>
            </div>
            <p className="mt-1 max-w-[32rem] text-sm font-medium leading-6 text-foreground/60">
              <span className="md:hidden">{helperText}</span>
              <span className="hidden md:inline">{userEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <ThemeToggle />
          <form action={logoutAction} className="hidden sm:block">
            <Button type="submit" variant="outline" size="sm" className="font-bold border-danger/30 bg-danger/5 text-danger hover:border-danger hover:bg-danger hover:text-danger-foreground">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
