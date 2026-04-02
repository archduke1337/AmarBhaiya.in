"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { TimelineAnimation } from "@/components/timeline-animation";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type HomeStatItem = {
  end: number;
  suffix: string;
  label: string;
};

type HomeDomainItem = {
  title: string;
  sub: string;
};

type HomeLearnItem = {
  title: string;
  who: string;
  desc: string;
};

type HomeFeaturedCourseItem = {
  title: string;
  sub: string;
  level: string;
  students: string;
  price: string;
  note: string;
  slug?: string;
};

type HomeWhyItem = {
  title: string;
  body: string;
};

type HomePageContent = {
  stats: HomeStatItem[];
  domains: HomeDomainItem[];
  learnItems: HomeLearnItem[];
  featuredCourses: HomeFeaturedCourseItem[];
  whyItems: HomeWhyItem[];
};

// ── Animated Counter ────────────────────────────────────────────────────

function Counter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const step = end / 120;
    const t = setInterval(() => {
      n += step;
      if (n >= end) { setCount(end); clearInterval(t); }
      else setCount(Math.floor(n));
    }, 16);
    return () => clearInterval(t);
  }, [inView, end]);

  return (
    <div ref={ref}>
      <div className="text-4xl md:text-6xl font-light tracking-tight">
        {count.toLocaleString("en-IN")}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-2 tracking-wide uppercase">{label}</div>
    </div>
  );
}

// ── Fade In on Scroll ───────────────────────────────────────────────────

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroMeshBackground = [
    "radial-gradient(140% 128% at 9% 96%, rgba(255,198,36,0.82) 0%, rgba(255,198,36,0) 54%)",
    "radial-gradient(128% 124% at 34% 75%, rgba(255,132,67,0.76) 0%, rgba(255,132,67,0) 57%)",
    "radial-gradient(136% 128% at 52% 55%, rgba(253,78,98,0.8) 0%, rgba(253,78,98,0) 60%)",
    "radial-gradient(124% 120% at 77% 33%, rgba(150,121,255,0.72) 0%, rgba(150,121,255,0) 60%)",
    "radial-gradient(122% 116% at 100% 3%, rgba(82,164,255,0.84) 0%, rgba(82,164,255,0) 52%)",
    "linear-gradient(128deg, rgba(22,8,20,0.62) 6%, rgba(14,22,55,0.58) 56%, rgba(8,9,18,0.64) 100%)",
    "#070a12",
  ].join(",");
  const heroMeshBlendMode = "screen,screen,screen,screen,screen,overlay,normal";
  const heroMeshFilter = "saturate(1.3) contrast(1.08)";
  const heroContrastOverlay =
    "radial-gradient(130% 120% at 50% -12%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 54%), linear-gradient(180deg, rgba(3,4,12,0.2) 0%, rgba(3,4,12,0.4) 54%, rgba(3,4,12,0.62) 100%)";
  const heroPalette = {
    color1: "#579dff",
    color2: "#ff4f68",
    color3: "#ffc538",
    brightness: 0.94,
    reflection: 0.42,
    speed: 0.24,
    strength: 0.28,
  };
  const [homeContent, setHomeContent] = useState<HomePageContent>({
    stats: [
      { end: 0, suffix: "+", label: "Students" },
      { end: 0, suffix: "+", label: "Courses" },
      { end: 0, suffix: "+", label: "Hours" },
      { end: 0, suffix: " yrs", label: "Teaching" },
    ],
    domains: [],
    learnItems: [],
    featuredCourses: [],
    whyItems: [],
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    function applyHomeContent(data: Partial<HomePageContent>) {
      setHomeContent((prev) => ({
        stats:
          Array.isArray(data.stats) && data.stats.length > 0 ? data.stats : prev.stats,
        domains: Array.isArray(data.domains) ? data.domains : prev.domains,
        learnItems: Array.isArray(data.learnItems) ? data.learnItems : prev.learnItems,
        featuredCourses: Array.isArray(data.featuredCourses)
          ? data.featuredCourses
          : prev.featuredCourses,
        whyItems: Array.isArray(data.whyItems) ? data.whyItems : prev.whyItems,
      }));
    }

    try {
      const cached = window.sessionStorage.getItem("home-content:v1");
      if (cached) {
        applyHomeContent(JSON.parse(cached) as Partial<HomePageContent>);
      }
    } catch {
      // Ignore invalid session cache.
    }

    async function loadHomeContent() {
      try {
        const response = await fetch("/api/content/home", {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Partial<HomePageContent>;
        if (cancelled) {
          return;
        }

        applyHomeContent(data);

        try {
          window.sessionStorage.setItem("home-content:v1", JSON.stringify(data));
        } catch {
          // Ignore storage quota/runtime errors.
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        // Non-blocking content load.
      }
    }

    void loadHomeContent();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO — Full screen mesh gradient + theme-aware shader     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-14 text-white"
      >
        {/* Shader Background — Responds to theme */}
        <Suspense>
          <ShaderGradientCanvas
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            lazyLoad={false}
            pixelDensity={1}
            pointerEvents="none"
          >
            <ShaderGradient
              animate="on"
              type="sphere"
              wireframe={false}
              shader="defaults"
              uTime={0}
              uSpeed={heroPalette.speed}
              uStrength={heroPalette.strength}
              uDensity={0.84}
              uFrequency={5.8}
              uAmplitude={3.6}
              positionX={-0.1}
              positionY={0}
              positionZ={0}
              rotationX={0}
              rotationY={130}
              rotationZ={70}
              color1={heroPalette.color1}
              color2={heroPalette.color2}
              color3={heroPalette.color3}
              reflection={heroPalette.reflection}
              cAzimuthAngle={270}
              cPolarAngle={180}
              cDistance={0.5}
              cameraZoom={15.1}
              lightType="env"
              brightness={heroPalette.brightness}
              envPreset="city"
              grain="on"
              toggleAxis={false}
              zoomOut={false}
              hoverState=""
              enableTransition={false}
            />
          </ShaderGradientCanvas>
        </Suspense>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-1"
          style={{
            background: heroMeshBackground,
            backgroundBlendMode: heroMeshBlendMode,
            filter: heroMeshFilter,
            transform: "scale(1.04)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-2"
          style={{ background: heroContrastOverlay }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24">
          <TimelineAnimation once as="h1" animationNum={1} timelineRef={heroRef}
            className="text-[12vw] md:text-[8vw] lg:text-[6vw] font-light leading-[1.05] tracking-tight max-w-5xl text-white"
          >
            Padhai karo
            <br />
            <span className="text-white/85">apne tareeke se.</span>
          </TimelineAnimation>

          <TimelineAnimation once animationNum={2} timelineRef={heroRef}
            className="mt-8 max-w-lg text-white/80 text-lg leading-relaxed font-light"
          >
            Class 8 se college tak — coding, fitness, career, aur life skills.
            Sab kuch ek jagah. No bakwaas.
          </TimelineAnimation>

          <TimelineAnimation once animationNum={3} timelineRef={heroRef} className="mt-10 flex items-center gap-6">
            <Link href="/register"
              className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm font-medium tracking-wide hover:bg-white/90 transition-colors"
            >
              Start learning <ArrowRight className="size-4" />
            </Link>
            <a href="#courses"
              className="text-sm text-white/80 hover:text-white transition-colors underline underline-offset-4 decoration-white/40"
            >
              Browse courses
            </a>
          </TimelineAnimation>
        </div>

        {/* Bottom domain strip */}
        <div className="relative z-10 border-t border-white/25 bg-black/22 backdrop-blur-[3px] px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/20">
            {homeContent.domains.length === 0 ? (
              <div className="col-span-2 md:col-span-4 py-5 px-4 text-xs text-white/70 uppercase tracking-widest">
                Domain strip content is not configured yet.
              </div>
            ) : null}
            {homeContent.domains.map((item, i) => (
              <TimelineAnimation key={`${item.title}-${i}`} once animationNum={4 + i} timelineRef={heroRef} className="py-5 px-4">
                <p className="text-xs font-medium tracking-wide uppercase text-white/90">{item.title}</p>
                <p className="text-xs text-white/70 mt-0.5">{item.sub}</p>
              </TimelineAnimation>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NUMBERS                                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-border py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {homeContent.stats.map((item, index) => (
            <Reveal key={`${item.label}-${index}`} delay={index * 0.1}>
              <Counter end={item.end} suffix={item.suffix} label={item.label} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ABOUT                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="about" className="border-t border-border py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">Ye kaun hai?</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light leading-tight tracking-tight">
              Main woh banda hoon jo tumhari galtiyan{" "}
              <span className="text-muted-foreground">pehle kar chuka hai.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 grid md:grid-cols-2 gap-12 text-muted-foreground leading-relaxed">
              <div className="space-y-6">
                <p>
                  School mein teachers ne sirf syllabus padhaya. College mein seniors ne sirf ragging ki.
                  YouTube pe 100 tutorials dekhe — aur phir bhi first project banana nahi aaya.
                </p>
                <p>
                  Ye meri kahani hai. Koi guide nahi tha. Koi shortcut nahi tha.
                  <strong className="text-foreground">
                    {" "}Par main har cheez khud figure out karta gaya.
                  </strong>
                </p>
              </div>
              <div className="space-y-6">
                <p>
                  Coding se lekar fitness, career decisions se lekar business — sab khud seekha.
                  Ab main ye sab tumhe sikha raha hoon.
                </p>
                <p>
                  Taaki tumhe woh <strong className="text-foreground">2 saal waste na karne pade</strong> jo maine kiye.
                  School mein ho ya college mein — yahan tumhare kaam ka zaroor milega.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WHAT YOU'LL LEARN                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-border py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">Kya milega?</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-20">
              Sirf padhai nahi.{" "}
              <span className="text-muted-foreground">Poori life ka syllabus.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {homeContent.learnItems.length === 0 ? (
              <div className="bg-background p-8 md:p-10 text-sm text-muted-foreground lg:col-span-3">
                Learning blocks are not configured yet.
              </div>
            ) : null}
            {homeContent.learnItems.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="bg-background p-8 md:p-10 h-full flex flex-col justify-between group hover:bg-accent transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
                      <span className="text-[10px] tracking-widest uppercase text-muted-foreground border border-border px-2 py-0.5">
                        {item.who}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-8">
                    <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* COURSES                                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="courses" className="border-t border-border py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">Courses</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-20">
              Seekho woh jo school{" "}
              <span className="text-muted-foreground">kabhi nahi sikhata.</span>
            </h2>
          </Reveal>

          <div className="divide-y divide-border">
            {homeContent.featuredCourses.length === 0 ? (
              <div className="py-8 md:py-10 text-sm text-muted-foreground">
                Featured courses are not configured yet.
              </div>
            ) : null}
            {homeContent.featuredCourses.map((course, i) => (
              <Reveal key={course.title} delay={i * 0.1}>
                <Link
                  href={course.slug ? `/courses/${course.slug}` : "/courses"}
                  className="group py-8 md:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl md:text-2xl font-light tracking-tight group-hover:text-muted-foreground transition-colors">
                        {course.title}
                      </h3>
                      <span className="text-[10px] tracking-widest uppercase text-muted-foreground border border-border px-2 py-0.5 shrink-0">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{course.sub}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{course.students} students enrolled</p>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-light">{course.price}</div>
                      <div className="text-xs text-muted-foreground/60">{course.note}</div>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-12">
              <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border">
                View all courses →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WHY                                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-border py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">Toh bhaiya hi kyun?</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-16">
              Kyunki baaki sab sirf padhate hain.
              <br />
              <span className="text-muted-foreground">Main samjhata hoon.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {homeContent.whyItems.length === 0 ? (
              <div className="text-sm text-muted-foreground md:col-span-2">
                Why-section points are not configured yet.
              </div>
            ) : null}
            {homeContent.whyItems.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div>
                  <h3 className="text-sm font-medium tracking-tight mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CTA                                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-border py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-light tracking-tight leading-tight">
              Abhi start karo.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground mt-6 text-lg font-light max-w-md mx-auto leading-relaxed">
              Sochte reh jaoge toh woh banda aage nikal jayega jo aaj shuru kar raha hai.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 text-sm font-medium tracking-wide hover:bg-foreground/90 transition-colors"
              >
                Free account banao <ArrowRight className="size-4" />
              </Link>
              <a href="#courses"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border"
              >
                Pehle courses dekho
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-xs text-muted-foreground/60 mt-6">
              Free hai. No credit card. No hidden charges.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
