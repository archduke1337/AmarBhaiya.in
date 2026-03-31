"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { TimelineAnimation } from "@/components/timeline-animation";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      <div className="text-sm text-neutral-500 mt-2 tracking-wide uppercase">{label}</div>
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

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO — Full screen, monochrome shader gradient            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-14"
      >
        {/* Shader Background — Monochrome */}
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
              uSpeed={0.2}
              uStrength={0.3}
              uDensity={0.8}
              uFrequency={5.5}
              uAmplitude={3.2}
              positionX={-0.1}
              positionY={0}
              positionZ={0}
              rotationX={0}
              rotationY={130}
              rotationZ={70}
              color1="#1a1a1a"
              color2="#333333"
              color3="#0a0a0a"
              reflection={0.4}
              cAzimuthAngle={270}
              cPolarAngle={180}
              cDistance={0.5}
              cameraZoom={15.1}
              lightType="env"
              brightness={0.8}
              envPreset="city"
              grain="on"
              toggleAxis={false}
              zoomOut={false}
              hoverState=""
              enableTransition={false}
            />
          </ShaderGradientCanvas>
        </Suspense>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24">
          <TimelineAnimation once as="h1" animationNum={1} timelineRef={heroRef}
            className="text-[12vw] md:text-[8vw] lg:text-[6vw] font-light leading-[1.05] tracking-tight max-w-5xl"
          >
            Padhai karo
            <br />
            <span className="text-neutral-500">apne tareeke se.</span>
          </TimelineAnimation>

          <TimelineAnimation once animationNum={2} timelineRef={heroRef}
            className="mt-8 max-w-lg text-neutral-400 text-lg leading-relaxed font-light"
          >
            Class 8 se college tak — coding, fitness, career, aur life skills.
            Sab kuch ek jagah. No bakwaas.
          </TimelineAnimation>

          <TimelineAnimation once animationNum={3} timelineRef={heroRef} className="mt-10 flex items-center gap-6">
            <Link href="/register"
              className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm font-medium tracking-wide hover:bg-neutral-200 transition-colors"
            >
              Start learning <ArrowRight className="size-4" />
            </Link>
            <a href="#courses"
              className="text-sm text-neutral-400 hover:text-white transition-colors underline underline-offset-4 decoration-neutral-700"
            >
              Browse courses
            </a>
          </TimelineAnimation>
        </div>

        {/* Bottom domain strip */}
        <div className="relative z-10 border-t border-neutral-800 px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-800">
            {[
              ["Coding & Tech", "DSA, Web Dev, Projects"],
              ["Board Exams", "Science, Maths, Strategy"],
              ["Fitness", "Routine, Nutrition, Mindset"],
              ["Career", "Placements, Business, Skills"],
            ].map(([title, sub], i) => (
              <TimelineAnimation key={title} once animationNum={4 + i} timelineRef={heroRef} className="py-5 px-4">
                <p className="text-xs font-medium tracking-wide uppercase text-neutral-300">{title}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>
              </TimelineAnimation>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NUMBERS                                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-800 py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <Reveal><Counter end={2400} suffix="+" label="Students" /></Reveal>
          <Reveal delay={0.1}><Counter end={15} suffix="+" label="Courses" /></Reveal>
          <Reveal delay={0.2}><Counter end={50} suffix="+" label="Hours" /></Reveal>
          <Reveal delay={0.3}><Counter end={4} suffix=" yrs" label="Teaching" /></Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ABOUT                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="about" className="border-t border-neutral-800 py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-6">Ye kaun hai?</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light leading-tight tracking-tight">
              Main woh banda hoon jo tumhari galtiyan{" "}
              <span className="text-neutral-500">pehle kar chuka hai.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 grid md:grid-cols-2 gap-12 text-neutral-400 leading-relaxed">
              <div className="space-y-6">
                <p>
                  School mein teachers ne sirf syllabus padhaya. College mein seniors ne sirf ragging ki.
                  YouTube pe 100 tutorials dekhe — aur phir bhi first project banana nahi aaya.
                </p>
                <p>
                  Ye meri kahani hai. Koi guide nahi tha. Koi shortcut nahi tha.
                  <strong className="text-white">
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
                  Taaki tumhe woh <strong className="text-white">2 saal waste na karne pade</strong> jo maine kiye.
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
      <section className="border-t border-neutral-800 py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-6">Kya milega?</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-20">
              Sirf padhai nahi.{" "}
              <span className="text-neutral-500">Poori life ka syllabus.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-800">
            {[
              { title: "Coding & Tech", who: "Class 9+", desc: "Mujhe kisi ne nahi sikhaya tha programming. Maine khud seekha. Yahan wahi milega — seedha, practical, kaam ka." },
              { title: "Board Exam Prep", who: "Class 10 & 12", desc: "Ratta maarna koi strategy nahi hai. PYQs, smart notes, revision tricks — tested by real toppers." },
              { title: "Fitness & Health", who: "Everyone", desc: "Jab tum subah 6 baje uthke exercise karte ho, din ka har kaam aasaan lagta hai. Student-friendly routines." },
              { title: "Career Guidance", who: "Class 11+", desc: "Kaunsa stream? Kaunsa college? Job ya business? In sab ka jawab dunga apne experience se." },
              { title: "Entrepreneurship", who: "College", desc: "Maine college mein hi apna kaam shuru kiya. Idea se pehle customer tak — sab sikhaunga." },
              { title: "Life Skills", who: "Everyone", desc: "Time management, communication, confidence — ye subjects mein nahi milte lekin life mein sabse kaam aate hain." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="bg-black p-8 md:p-10 h-full flex flex-col justify-between group hover:bg-neutral-950 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
                      <span className="text-[10px] tracking-widest uppercase text-neutral-600 border border-neutral-800 px-2 py-0.5">
                        {item.who}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-8">
                    <ArrowRight className="size-4 text-neutral-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
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
      <section id="courses" className="border-t border-neutral-800 py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-6">Courses</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-20">
              Seekho woh jo school{" "}
              <span className="text-neutral-500">kabhi nahi sikhata.</span>
            </h2>
          </Reveal>

          <div className="divide-y divide-neutral-800">
            {[
              { title: "Complete Coding Bootcamp", sub: "HTML → CSS → JS → React → Backend", level: "Class 9+", students: "1,200+", price: "Free", note: "First 5 modules free" },
              { title: "Board Exam Domination", sub: "Science & Maths — Smart Notes, PYQ, Strategy", level: "10th & 12th", students: "680+", price: "₹499", note: "Full access" },
              { title: "Student Fitness Blueprint", sub: "No gym needed. Hostel or home — works anywhere", level: "Everyone", students: "520+", price: "Free", note: "Always free" },
            ].map((course, i) => (
              <Reveal key={course.title} delay={i * 0.1}>
                <div className="group py-8 md:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl md:text-2xl font-light tracking-tight group-hover:text-neutral-300 transition-colors">
                        {course.title}
                      </h3>
                      <span className="text-[10px] tracking-widest uppercase text-neutral-600 border border-neutral-800 px-2 py-0.5 shrink-0">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">{course.sub}</p>
                    <p className="text-xs text-neutral-600 mt-1">{course.students} students enrolled</p>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-light">{course.price}</div>
                      <div className="text-xs text-neutral-600">{course.note}</div>
                    </div>
                    <ArrowRight className="size-5 text-neutral-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-12">
              <Link href="/courses" className="text-sm text-neutral-500 hover:text-white transition-colors underline underline-offset-4 decoration-neutral-700">
                View all courses →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WHY                                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-800 py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs tracking-widest uppercase text-neutral-500 mb-6">Toh bhaiya hi kyun?</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-16">
              Kyunki baaki sab sirf padhate hain.
              <br />
              <span className="text-neutral-500">Main samjhata hoon.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {[
              { title: "No boring lectures", body: "40 minute ki video mein 10 minute kaam ka? Nahi. Mere har course mein sirf woh content hai jo actually kaam aaye." },
              { title: "Seedha bhaiya se baat", body: "Doubt hai? Community mein pucho. Main khud answer karunga. Koi customer care nahi, koi bot nahi." },
              { title: "Karta nahi, karata hoon", body: "Sirf lectures nahi — har module ke baad assignments. Projects banao, submit karo, feedback lo." },
              { title: "Itna sasta ki free jaisa", body: "Papa ke paise waste nahi honge. Bahut kuch free hai, aur jo paid hai woh doston ki party ka bill jitna hai." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div>
                  <h3 className="text-sm font-medium tracking-tight mb-3">{item.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CTA                                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-neutral-800 py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-light tracking-tight leading-tight">
              Abhi start karo.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-neutral-500 mt-6 text-lg font-light max-w-md mx-auto leading-relaxed">
              Sochte reh jaoge toh woh banda aage nikal jayega jo aaj shuru kar raha hai.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-sm font-medium tracking-wide hover:bg-neutral-200 transition-colors"
              >
                Free account banao <ArrowRight className="size-4" />
              </Link>
              <a href="#courses"
                className="text-sm text-neutral-500 hover:text-white transition-colors underline underline-offset-4 decoration-neutral-700"
              >
                Pehle courses dekho
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-xs text-neutral-600 mt-6">
              Free hai. No credit card. No hidden charges.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
