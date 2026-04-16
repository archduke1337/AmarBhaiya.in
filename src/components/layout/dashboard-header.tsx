import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@heroui/react";
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
      ? "Aaj ka flow simple rakho: continue, waive, phir next step."
      : userEmail;

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 pt-safe">
      <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-4">
          <MobileSidebar role={role} userId={userId} />
          
          <div className="flex min-w-0 flex-col">
            <p className="eyebrow self-start mb-2">
              {eyebrow}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-[-0.03em] leading-none">{firstName}</h1>
              <div aria-hidden className="hidden sm:flex items-center px-2 py-0.5 rounded-md bg-surface border border-border/60 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-foreground/70">
                {role}
              </div>
            </div>
            <p className="max-w-[32rem] text-sm font-medium text-foreground/60 mt-1">
              <span className="md:hidden">{helperText}</span>
              <span className="hidden md:inline">{userEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <ThemeToggle />
          <form action={logoutAction} className="hidden sm:block">
            <Button type="submit" variant="faded" size="sm" className="font-bold border-border/40 hover:bg-surface text-danger hover:text-danger-foreground hover:border-danger hover:bg-danger">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
