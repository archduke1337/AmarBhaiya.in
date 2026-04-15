import Link from "next/link";
import { Home } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <MobileSidebar role={role} userId={userId} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {userName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-sm" className="hidden sm:inline-flex">
            <Link href="/" aria-label="Back to home">
              <Home className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="xs">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
