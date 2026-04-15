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
  return (
    <header className="sticky top-0 z-20 bg-background px-4 py-4 md:px-6">
      <div className="retro-surface flex flex-col gap-4 bg-card px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <MobileSidebar role={role} userId={userId} />
          <div className="flex flex-col gap-2">
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl">{userName}</h1>
              <Badge variant="secondary">{role}</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
