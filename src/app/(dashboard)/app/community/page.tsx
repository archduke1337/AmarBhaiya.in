import Link from "next/link";
import { MessageSquare, Pin } from "lucide-react";

import { createForumThreadAction } from "@/actions/dashboard";
import { requireAuth } from "@/lib/appwrite/auth";
import {
  getCommunityCategoriesData,
  getCommunityThreadsData,
} from "@/lib/appwrite/dashboard-data";
import { PageHeader, EmptyState } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RetroPanel } from "@/components/marketing/retro-panel";
import { Textarea } from "@/components/ui/textarea";

export default async function CommunityPage() {
  await requireAuth();
  const [threads, categories] = await Promise.all([
    getCommunityThreadsData(),
    getCommunityCategoriesData(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Community"
        title="Doubt ko andar mat rakho. Community mein pooch lo."
        description="Course ya lesson ka doubt exact page par poochna best hai. General study questions, planning, aur peer help ke liye yeh community space hai."
      />

      {/* Create thread form */}
      <RetroPanel tone="card" className="space-y-0 p-0">
        <div className="border-b-2 border-border px-5 py-4">
          <h2 className="font-heading text-lg font-black tracking-[-0.03em]">
            Start a discussion
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Clear title likho. Body mein context do. Log help kar payenge.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="px-5 py-6 text-sm font-medium leading-7 text-muted-foreground">
            Abhi community categories set nahi hui hain. Categories publish hote hi thread start kar paoge.
          </div>
        ) : (
          <form action={createForumThreadAction} className="flex flex-col gap-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="forumCatId">Category</Label>
                <select
                  id="forumCatId"
                  name="forumCatId"
                  className="h-11 w-full rounded-[calc(var(--radius)+2px)] border-2 border-border bg-input px-3.5 text-sm font-semibold text-foreground shadow-retro-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  required
                  defaultValue={categories[0]?.id ?? ""}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thread-title">Thread title</Label>
                <Input
                  id="thread-title"
                  type="text"
                  name="title"
                  placeholder="Example: Class 10 maths quadratic doubts"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thread-body">Your message</Label>
              <Textarea
                id="thread-body"
                name="body"
                placeholder="Kya samajh nahi aa raha? Course/subject mention kar do, aur jitna context ho utna likho..."
                required
                minLength={12}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="secondary">
                Post thread
              </Button>
            </div>
          </form>
        )}
      </RetroPanel>

      {/* Thread list */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-black tracking-[-0.03em] text-muted-foreground">
          Discussions ({threads.length})
        </h2>

        {threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No discussions yet"
            description="Pehla thread start kar sakte ho. Bas question clear rakho, taaki help karna easy ho."
          />
        ) : (
          threads.map((thread) => (
            <RetroPanel
              key={thread.id}
              tone={thread.pinned ? "secondary" : "card"}
              className="group space-y-3 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-4">
                <Badge variant="outline">{thread.category}</Badge>
                {thread.pinned && (
                  <Badge variant="ghost">
                    <Pin className="size-3" />
                    Pinned
                  </Badge>
                )}
              </div>

              <h3 className="font-heading text-2xl font-black leading-tight tracking-[-0.04em]">
                <Link
                  href={`/app/community/${thread.id}`}
                  className="hover:underline underline-offset-4"
                >
                  {thread.title}
                </Link>
              </h3>

              <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-muted-foreground">
                <span>by {thread.author}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-4" />
                  {thread.replies} replies
                </span>
              </div>
            </RetroPanel>
          ))
        )}
      </section>
    </div>
  );
}
