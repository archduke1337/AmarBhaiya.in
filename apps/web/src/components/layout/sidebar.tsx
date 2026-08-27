"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { Role } from "@/lib/utils/constants";
import { logoutAction } from "@/server/appwrite/actions";
import { getNavItems, getWorkspaceCopy, isNavItemActive } from "@/config/dashboard-nav";

type SidebarProps = {
  role: Role;
  userId: string;
};

export function Sidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role, userId);

  return (
    <aside className="hidden h-full border-r border-border/40 bg-surface md:sticky md:top-0 md:flex md:h-screen md:flex-col overflow-y-auto">
      <div className="flex flex-col gap-1 border-b border-border/30 p-4 text-foreground xl:px-6 xl:py-6">
        <div className="flex items-center gap-2">
           <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }} aria-hidden="true">
             {role === "admin" ? "A" : role === "instructor" ? "I" : role === "moderator" ? "M" : "S"}
           </span>
           <span className="font-bold text-sm tracking-[-0.02em] hidden xl:block text-foreground/90">
             Learning<span className="text-accent underline decoration-2 underline-offset-4 decoration-accent">Hub</span>
           </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3 xl:p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 md:justify-center md:w-11 xl:h-auto xl:w-auto xl:justify-start",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/60 hover:text-foreground/90 hover:bg-surface-hover hover:scale-[0.98]"
              )}
              title={item.label}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-300 flex-shrink-0",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="hidden min-w-0 truncate tracking-tight xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden px-4 pb-8 xl:block mt-auto">
        <div className="bg-surface border border-border/50 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
          <div aria-hidden="true" className="absolute -right-4 -top-4 w-[60px] h-[60px] rounded-full opacity-[0.1] blur-[20px]" style={{ background: "var(--accent)" }} />
          <p className="eyebrow self-start">
            Workspace
          </p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-foreground/60">
            {getWorkspaceCopy(role)}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ role, userId }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const navItems = getNavItems(role, userId);

  const closeDrawer = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const focusable = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    firstFocusable?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      } else if (event.key === "Tab" && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="md:hidden text-foreground/70"
        aria-label="Open dashboard menu"
        aria-expanded={open}
        aria-controls="dashboard-mobile-menu"
        ref={triggerRef}
      >
        <Menu className="size-5" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div id="dashboard-mobile-menu" ref={drawerRef} className="fixed inset-y-0 left-0 z-50 w-[min(86vw,20rem)] overflow-y-auto overscroll-contain border-r border-border/40 bg-background shadow-2xl md:hidden flex flex-col animate-slide-in-left" role="dialog" aria-modal="true" aria-label="Dashboard navigation">
            <div className="absolute right-3 top-3 z-10 pt-safe">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={closeDrawer}
                aria-label="Close menu"
                className="text-foreground/60 rounded-full"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="border-b border-border/30 bg-surface px-6 pt-[calc(var(--safe-top)+1.5rem)] pb-6 text-foreground flex flex-col gap-2 relative overflow-hidden">
               <div aria-hidden="true" className="absolute -left-10 -bottom-10 w-[120px] h-[120px] rounded-full opacity-[0.06] blur-[40px]" style={{ background: "var(--accent)" }} />
               <p className="eyebrow self-start">{role}</p>
               <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">Learning<span className="text-accent underline decoration-2 underline-offset-4 decoration-accent">Hub</span></h2>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[44px] text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/60 hover:text-foreground/90 hover:bg-surface-hover"
                    )}
                  >
                    <Icon strokeWidth={isActive ? 2.5 : 2} className={cn("size-5 flex-shrink-0 transition-transform", isActive ? "scale-110" : "")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto p-4 pb-[calc(var(--safe-bottom)+1.5rem)]">
               <form action={logoutAction} className="w-full">
                 <Button type="submit" variant="outline" className="w-full font-bold border-danger/20 bg-danger/5 text-danger hover:border-danger hover:bg-danger hover:text-danger-foreground">
                   Sign out
                 </Button>
               </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
