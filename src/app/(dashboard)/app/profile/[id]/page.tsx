import { notFound } from "next/navigation";

import { getUserRole } from "@/lib/appwrite/auth-utils";
import { requireAuth } from "@/lib/appwrite/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: PageProps) {
  const currentUser = await requireAuth();
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const isOwner = id === currentUser.$id;
  const role = getUserRole(currentUser);

  const profileName = isOwner ? currentUser.name : "Community Learner";
  const profileEmail = isOwner ? currentUser.email : "Hidden";

  return (
    <div className="space-y-8">
      <section className="border border-border p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Profile
        </p>
        <h1 className="text-3xl md:text-4xl">{profileName}</h1>
        <p className="text-muted-foreground mt-2">{profileEmail}</p>
        <p className="text-sm text-muted-foreground mt-3">Role: {role}</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current streak</p>
          <p className="text-2xl">14 days</p>
        </article>
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Courses active</p>
          <p className="text-2xl">3</p>
        </article>
        <article className="border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Certificates</p>
          <p className="text-2xl">0</p>
        </article>
      </section>

      <section className="border border-border p-6">
        <h2 className="text-xl mb-3">About</h2>
        <p className="text-muted-foreground leading-relaxed">
          {isOwner
            ? "This is your learner profile. Public sharing and certificate showcase will expand in Phase 11."
            : "Public profile preview is limited right now. Expanded public profile data will be added in upcoming phases."}
        </p>
      </section>
    </div>
  );
}
