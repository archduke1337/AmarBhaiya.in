"use client";

/**
 * GlowFeatureCards — wraps the homepage "Why amarbhaiya.in?" features grid
 * with GlowHover's cursor-following glow effect.
 */

import GlowHover from "@/components/smoothui/glow-hover-card";

type FeatureItem = {
  title: string;
  body: string;
  index: number;
};

export function GlowFeatureCards({ items }: { items: FeatureItem[] }) {
  return (
    <GlowHover
      className="grid gap-4 sm:grid-cols-2"
      glowIntensity={0.12}
      maskSize={350}
      items={items.map((item) => ({
        id: `feature-${item.index}`,
        element: (
          <div className="card-bezel h-full">
            <div className="card-bezel-inner p-6 flex flex-col gap-4">
              <span
                className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black text-accent"
                style={{
                  background:
                    "color-mix(in oklab, var(--accent) 10%, transparent)",
                }}
                aria-hidden="true"
              >
                {String(item.index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground/55 mt-1 leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          </div>
        ),
      }))}
    />
  );
}