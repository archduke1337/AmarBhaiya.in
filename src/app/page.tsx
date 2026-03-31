import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { OWNER, SITE_TAGLINE } from "@/lib/utils/constants";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-300/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
          <Avatar fallback={OWNER.name} size="xl" />

          <div className="space-y-4">
            <Badge variant="brand" size="md">
              🚀 Platform Coming Soon
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter font-[var(--font-heading)]">
              <span className="text-gradient-warm">{SITE_TAGLINE}</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {OWNER.name}&apos;s unified platform for Education, Fitness,
              Career Guidance, Entrepreneurship & Personal Development.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl">
              Explore Courses
            </Button>
            <Button variant="outline" size="xl">
              About Bhaiya
            </Button>
          </div>
        </div>
      </section>

      {/* ── Identity Cards ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            One person.{" "}
            <span className="text-gradient">Many domains.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {OWNER.roles.map((role, i) => (
              <Card
                key={role.title}
                variant="gradient"
                hover
                className="text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="pt-2 space-y-3">
                  <div
                    className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white text-2xl`}
                  >
                    {role.title[0]}
                  </div>
                  <CardTitle className="text-base">{role.title}</CardTitle>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Design System Preview ────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-3xl font-bold text-center tracking-tight">
            Design System
          </h2>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="link">Link</Button>
              <Button isLoading>Loading</Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Role and status indicators</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Badge variant="brand">Brand</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="purple">Purple</Badge>
            </CardContent>
          </Card>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard bordered card</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Glassmorphism effect</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>With shadow elevation</CardDescription>
              </CardHeader>
            </Card>
            <Card variant="gradient" hover>
              <CardHeader>
                <CardTitle>Gradient Card</CardTitle>
                <CardDescription>With hover lift effect</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border bg-surface px-6 py-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-[var(--text-muted)]">
          <p>
            &copy; {new Date().getFullYear()} amarbhaiya.in — Built with ❤️ by{" "}
            {OWNER.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
