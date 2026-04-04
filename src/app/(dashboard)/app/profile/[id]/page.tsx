import { notFound } from "next/navigation";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { requireAuth } from "@/lib/appwrite/auth";
import { getStudentProfileStats } from "@/lib/appwrite/dashboard-data";
import { getStudentProfile } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="space-y-8">
      <section className="border border-border p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar data-size="lg">
            {avatarFileId ? (
              <AvatarImage src="/api/avatar/current" alt={profileName} />
            ) : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Profile
            </p>
            <h1 className="text-3xl md:text-4xl">{profileName}</h1>
            <p className="text-muted-foreground mt-2">{profileEmail}</p>
            <p className="text-sm text-muted-foreground mt-3">Role: {role}</p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current streak</p>
          <p className="text-2xl">
            {profileStats ? `${profileStats.currentStreakDays} days` : "Private"}
          </p>
        </article>
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Courses active</p>
          <p className="text-2xl">
            {profileStats ? profileStats.activeCourses : "Private"}
          </p>
        </article>
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Certificates</p>
          <p className="text-2xl">
            {profileStats ? profileStats.certificates : "Private"}
          </p>
        </article>
      </section>

      {isOwner ? (
        <section className="grid gap-4 md:grid-cols-2">
          {personalMeta.map((item) => (
            <article key={item.label} className="border border-border p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {item.label}
              </p>
              <p className="text-lg">{item.value}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="border border-border p-6">
        <h2 className="text-xl mb-3">About</h2>
        <p className="text-muted-foreground leading-relaxed">
          {isOwner
            ? profile?.bio?.trim()
              ? profile.bio
              : "This is your learner profile. Add a short bio from profile settings to help instructors know you better."
            : "Public profile preview is limited right now. Expanded public profile data will be added in upcoming phases."}
        </p>
        {isOwner && profile?.hobby ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Interests: {profile.hobby}
          </p>
        ) : null}
      </section>
    </div>
  );
}
