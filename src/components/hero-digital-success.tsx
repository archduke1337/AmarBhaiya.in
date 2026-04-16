'use client';

/**
 * HeroDigitalSuccess
 * ──────────────────
 * Animated hero section used on the marketing site.
 * ShaderGradient is loaded via next/dynamic so the Three.js/WebGL
 * bundle (~800 KB) is never included in the initial JS payload.
 */

import React, { Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import { TimelineAnimation } from '@/components/timeline-animation';
import { useMediaQuery } from '@/components/use-media-query';
import MotionDrawer from '@/components/motion-drawer';
import Link from 'next/link';

// ── Lazy-load the heavy ShaderGradient canvas (Three.js + WebGL) ─────────────
// ssr: false because ShaderGradient uses WebGL APIs that don't exist in Node.
const ShaderGradientCanvas = dynamic(
  () => import('@shadergradient/react').then((mod) => mod.ShaderGradientCanvas),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-black" /> }
);
const ShaderGradient = dynamic(
  () => import('@shadergradient/react').then((mod) => mod.ShaderGradient),
  { ssr: false }
);

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Courses', href: '/courses' },
  { label: 'Notes', href: '/notes' },
  { label: 'About', href: '/about' },
];

export const HeroDigitalSuccess = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section
      ref={timelineRef}
      className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col"
    >
      {/* ── Gradient background (lazy-loaded) ──────────────────────────── */}
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <ShaderGradientCanvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
          lazyLoad
          pixelDensity={1}
          pointerEvents="none"
        >
          <ShaderGradient
            animate="on"
            type="sphere"
            wireframe={false}
            shader="defaults"
            uTime={0}
            uSpeed={0.3}
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
            color1="#FFCC00"
            color2="#FF3333"
            color3="#0066FF"
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

      {/* ── Mobile header ─────────────────────────────────────────────── */}
      {isMobile && (
        <div className="flex gap-4 justify-between items-center px-6 pt-4 relative z-10">
          <MotionDrawer
            direction="left"
            width={280}
            backgroundColor="#000000"
            clsBtnClassName="bg-neutral-800 border-r border-neutral-900 text-white"
            contentClassName="bg-black border-r border-neutral-900 text-white"
            btnClassName="bg-white text-black relative w-fit p-2 left-0 top-0"
          >
            <nav className="space-y-2 pt-4">
              <p className="px-4 pb-3 font-heading text-xs uppercase tracking-[0.18em] text-neutral-400">
                amarbhaiya.in
              </p>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 px-4">
                <Link
                  href="/register"
                  className="block w-full text-center py-3 rounded-full bg-white text-black font-bold text-sm"
                >
                  Free account banao
                </Link>
              </div>
            </nav>
          </MotionDrawer>

          <Link href="/login">
            <TimelineAnimation
              once
              as="span"
              animationNum={3}
              timelineRef={timelineRef}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-neutral-800 text-white"
            >
              Login
            </TimelineAnimation>
          </Link>
        </div>
      )}

      {/* ── Desktop header ────────────────────────────────────────────── */}
      {!isMobile && (
        <header className="relative z-10 flex items-center justify-between px-10 py-4">
          <TimelineAnimation
            once
            animationNum={1}
            timelineRef={timelineRef}
            className="flex items-center gap-2"
          >
            <span className="font-heading text-xl font-black tracking-[-0.04em] text-white">
              amarbhaiya.in
            </span>
          </TimelineAnimation>

          <TimelineAnimation
            once
            as="nav"
            animationNum={2}
            timelineRef={timelineRef}
            className="hidden md:flex items-center gap-10 text-sm text-white/80 font-medium"
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </TimelineAnimation>

          <TimelineAnimation
            once
            as="div"
            animationNum={3}
            timelineRef={timelineRef}
            className="flex items-center gap-3"
          >
            <Link
              href="/login"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm bg-white text-black hover:bg-white/90 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
              Start free
            </Link>
          </TimelineAnimation>
        </header>
      )}

      {/* ── Hero content ──────────────────────────────────────────────── */}
      <div className="relative z-10 grow flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <TimelineAnimation
          once
          as="p"
          animationNum={4}
          timelineRef={timelineRef}
          className="font-heading text-xs uppercase tracking-[0.22em] text-white/50 mb-6"
        >
          Learn from Amar Bhaiya
        </TimelineAnimation>

        <TimelineAnimation
          once
          as="h1"
          animationNum={5}
          timelineRef={timelineRef}
          className="font-heading text-[10vw] xl:text-[6vw] font-black leading-[0.92] tracking-[-0.05em] text-white mb-8"
        >
          Padhai ko simple,
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-300 to-red-400">
            honest, aur useful
          </span>
          <br />
          banana tha.
        </TimelineAnimation>

        <div className="flex flex-wrap gap-4">
          <TimelineAnimation
            once
            as="div"
            animationNum={6}
            timelineRef={timelineRef}
          >
            <Link
              href="/courses"
              className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-base hover:bg-white/90 transition-colors shadow-[0_0_30px_rgba(255,200,0,0.3)]"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
              Courses dekho
            </Link>
          </TimelineAnimation>

          <TimelineAnimation
            once
            as="div"
            animationNum={7}
            timelineRef={timelineRef}
          >
            <Link
              href="/notes"
              className="border border-white/20 bg-white/5 backdrop-blur-md px-8 py-4 rounded-full font-medium text-base text-white hover:bg-white/10 transition-colors"
            >
              Notes kholo
            </Link>
          </TimelineAnimation>
        </div>
      </div>

      {/* ── Footer stats ──────────────────────────────────────────────── */}
      <div className="relative z-10 p-8 md:p-12 flex flex-wrap justify-end items-end">
        <TimelineAnimation
          once
          animationNum={8}
          timelineRef={timelineRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-4 bg-black/30 backdrop-blur-lg px-6 py-4 rounded-xl border border-white/10"
        >
          <div>
            <p className="text-white text-sm font-bold mb-0.5">Class 6–12</p>
            <p className="text-neutral-400 text-xs">School courses</p>
          </div>
          <div>
            <p className="text-white text-sm font-bold mb-0.5">Notes Library</p>
            <p className="text-neutral-400 text-xs">Free downloads</p>
          </div>
          <div>
            <p className="text-white text-sm font-bold mb-0.5">Live Sessions</p>
            <p className="text-neutral-400 text-xs">Direct Q&amp;A</p>
          </div>
          <div>
            <p className="text-white text-sm font-bold mb-0.5">Skills &amp; Career</p>
            <p className="text-neutral-400 text-xs">Growth tracks</p>
          </div>
        </TimelineAnimation>
      </div>
    </section>
  );
};
