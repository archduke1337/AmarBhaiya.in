"use client";

/**
 * Category filter for the courses catalogue.
 * SmoothUI AnimatedTabs (pill) driving URL-param navigation so the page
 * stays server-rendered. Preserves q/track/class/sort params on switch.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import AnimatedTabs from "@/components/smoothui/animated-tabs";
import { cn } from "@/lib/utils";

type CourseCategoryTabsProps = {
  categories: string[];
  activeCategory: string;
};

export function CourseCategoryTabs({ categories, activeCategory }: CourseCategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const tabs = [
    { id: "all", label: "All" },
    ...categories.map((category) => ({ id: category, label: category })),
  ];

  function handleChange(tabId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "all") {
      params.delete("category");
    } else {
      params.set("category", tabId);
    }
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/courses?${query}` : "/courses", { scroll: false });
    });
  }

  return (
    <div className={cn("min-h-11 transition-opacity duration-200", isPending && "pointer-events-none opacity-50")}>
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeCategory}
        onChange={handleChange}
        variant="pill"
        layoutId="course-category-tabs"
        className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      />
    </div>
  );
}
