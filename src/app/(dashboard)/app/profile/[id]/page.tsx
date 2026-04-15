import { notFound } from "next/navigation";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { requireAuth } from "@/lib/appwrite/auth";
import { getStudentProfileStats } from "@/lib/appwrite/dashboard-data";
import { getStudentProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetroPanel } from "@/components/marketing/retro-panel";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getInitials(value: string): string {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default async function ProfilePage({ params }: PageProps) {
  const currentUser = await requireAuth();
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const isOwner = id === currentUser.$id;
  const role = getUserRole(currentUser);
  const profileStats = isOwner
    ? await getStudentProfileStats(currentUser.$id)
    : null;
  const profile = isOwner ? await getStudentProfile() : null;

  const profileName = isOwner ? currentUser.name : "Community Learner";
  const profileEmail = isOwner ? currentUser.email : "Hidden";
  const avatarFileId = isOwner ? String(currentUser.prefs?.avatarFileId ?? "") : "";
  const avatarFallback = getInitials(profileName || "User");

  const personalMeta = isOwner
    ? [
        { label: "Grade", value: profile?.grade || "—" },
        { label: "School", value: profile?.school || "—" },
        { label: "City", value: profile?.city || "—" },
        { label: "State", value: profile?.state || "—" },
      ]
    : [];

  return (
    <div className="max-w-5xl space-y-8">
      <RetroPanel tone="card" size="lg">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar data-size="lg">
            {avatarFileId ? (
              <AvatarImage src="/api/avatar/current" alt={profileName} />
            ) : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="mb-3 font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Profile
            </p>
            <h1 className="font-heading text-3xl font-black tracking-[-0.05em] md:text-5xl">
              {profileName}
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{profileEmail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{role}</Badge>
              {profile?.grade ? <Badge variant="outline">{profile.grade}</Badge> : null}
              {profile?.city ? <Badge variant="ghost">{profile.city}</Badge> : null}
            </div>
          </div>
          {isOwner ? (
            <Button asChild variant="outline" className="w-full md:w-auto">
              <Link href="/app/profile/edit">Edit profile</Link>
            </Button>
          ) : null}
        </div>
      </RetroPanel>

      <section className="grid md:grid-cols-3 gap-4">
        <RetroPanel tone="secondary">
          <p className="mb-2 font-heading text-xs uppercase tracking-widest text-muted-foreground">Current streak</p>
          <p className="font-heading text-3xl font-black tracking-[-0.06em]">
            {profileStats ? `${profileStats.currentStreakDays} days` : "Private"}
          </p>
        </RetroPanel>
        <RetroPanel tone="accent">
          <p className="mb-2 font-heading text-xs uppercase tracking-widest text-muted-foreground">Courses active</p>
          <p className="font-heading text-3xl font-black tracking-[-0.06em]">
            {profileStats ? profileStats.activeCourses : "Private"}
          </p>
        </RetroPanel>
        <RetroPanel tone="card">
          <p className="mb-2 font-heading text-xs uppercase tracking-widest text-muted-foreground">Certificates</p>
          <p className="font-heading text-3xl font-black tracking-[-0.06em]">
            {profileStats ? profileStats.certificates : "Private"}
          </p>
        </RetroPanel>
      </section>

      {isOwner ? (
        <section className="grid gap-4 md:grid-cols-2">
          {personalMeta.map((item) => (
            <RetroPanel key={item.label} tone="muted">
              <p className="mb-2 font-heading text-xs uppercase tracking-widest text-muted-foreground">
                {item.label}
              </p>
              <p className="text-lg font-semibold">{item.value}</p>
            </RetroPanel>
          ))}
        </section>
      ) : null}

      <RetroPanel tone="card">
        <h2 className="mb-3 font-heading text-2xl font-black tracking-[-0.04em]">About</h2>
        <p className="font-medium leading-8 text-muted-foreground">
          {isOwner
            ? profile?.bio?.trim()
              ? profile.bio
              : "Yeh tumhara learner profile hai. Ek short bio add kar doge toh instructors ko tumhari learning context samajhne mein help milegi."
            : "Public profile preview abhi limited hai."}
        </p>
        {isOwner && profile?.hobby ? (
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Interests: {profile.hobby}
          </p>
        ) : null}
      </RetroPanel>
    </div>
  );
}
