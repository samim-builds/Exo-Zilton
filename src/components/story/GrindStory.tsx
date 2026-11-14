"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { track } from "@vercel/analytics";
import { FINALE, STORY, type StoryChapter } from "./story-copy";
import { CHAPTERS } from "./timeline";

// No loading placeholder: the dark stage and headline render instantly, and the
// scene fades in once its first frame is drawn (see `onReady`).
const GrindScene = dynamic(() => import("./GrindScene"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

function useMediaQuery(query: string, serverValue: boolean) {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

function ChapterCopy({ chapter, progress, index }: { chapter: StoryChapter; progress: MotionValue<number>; index: number }) {
  const [start, end] = chapter.range;
  const fade = 0.035;
  const isIntro = index === 0;
  const opacity = useTransform(
    progress,
    isIntro ? [0, end - fade, end] : [start, start + fade, end - fade, end],
    isIntro ? [1, 1, 0] : [0, 1, 1, 0],
  );
  const y = useTransform(
    progress,
    isIntro ? [0, end] : [start, start + fade, end - fade, end],
    isIntro ? [0, -40] : [36, 0, 0, -36],
  );

  if (isIntro) {
    return (
      <motion.div style={{ opacity }} className="absolute inset-0">
        <motion.div style={{ y }} className="absolute inset-x-0 top-[20%] px-6 text-center sm:top-[18%]">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C29B62] sm:text-[11px]">
            {chapter.eyebrow}
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-serif text-4xl font-light leading-[1.05] tracking-tight text-porcelain sm:text-6xl lg:text-7xl">
            {chapter.title}
          </h1>
        </motion.div>
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-porcelain/60">{chapter.body}</span>
          <motion.span
            className="block h-10 w-px origin-top bg-gradient-to-b from-[#C29B62] to-transparent"
            animate={{ scaleY: [0, 1, 0], y: [0, 0, 20] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      style={{ opacity, y }}
      className="absolute inset-x-0 bottom-0 px-6 pb-24 pt-24 sm:pb-14 md:inset-x-auto md:bottom-auto md:left-[7%] md:top-1/2 md:max-w-md md:-translate-y-1/2 md:p-0"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#070d16] via-[#070d16]/85 to-transparent md:hidden" />
      <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C29B62] sm:text-[11px]">{chapter.eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl font-light leading-[1.1] tracking-tight text-porcelain sm:text-5xl">
        {chapter.title}
      </h2>
      {chapter.body && (
        <p className="mt-5 font-sans text-[15px] leading-[1.7] text-porcelain/70 sm:text-[16px]">{chapter.body}</p>
      )}
    </motion.article>
  );
}

function ChapterRail({ progress }: { progress: MotionValue<number> }) {
  const fill = useTransform(progress, [CHAPTERS.spices[0], CHAPTERS.finale[0]], [0, 1]);
  const opacity = useTransform(progress, [0.08, 0.12, 0.88, 0.92], [0, 1, 1, 0]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute right-6 top-1/2 hidden h-48 -translate-y-1/2 md:block lg:right-10"
      aria-hidden="true"
    >
      <div className="h-full w-px bg-porcelain/15" />
      <motion.div style={{ scaleY: fill }} className="absolute inset-0 w-px origin-top bg-[#C29B62]" />
    </motion.div>
  );
}

function Finale({ progress }: { progress: MotionValue<number> }) {
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(progress, "change", (v) => setVisible(v > CHAPTERS.finale[0] + 0.03));

  return (
    <motion.div
      initial={false}
      animate={visible ? "show" : "hide"}
      className={`absolute inset-x-0 bottom-[12%] flex flex-col items-center px-6 text-center ${visible ? "" : "pointer-events-none"}`}
    >
      <motion.p
        variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, ease: EASE }}
        className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C29B62] sm:text-[11px]"
      >
        {FINALE.eyebrow}
      </motion.p>
      <motion.h2
        variants={{ hide: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 1, ease: EASE, delay: 0.1 }}
        className="mt-4 max-w-2xl font-serif text-3xl font-light leading-[1.1] tracking-tight text-porcelain sm:text-5xl"
      >
        {FINALE.title}
      </motion.h2>

      <motion.div
        variants={{ hide: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
        className="relative mt-9"
      >
        {/* Soft bronze halo that breathes behind the button */}
        <motion.span
          aria-hidden="true"
          className="absolute -inset-3 bg-[#C29B62]/25 blur-xl"
          animate={visible ? { opacity: [0.25, 0.7, 0.25], scale: [0.96, 1.04, 0.96] } : { opacity: 0 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Link
          href="/products"
          tabIndex={visible ? 0 : -1}
          onClick={() => track("story_shop_now")}
          className="group relative inline-flex items-center gap-4 overflow-hidden border border-[#C29B62] bg-[#0D1929]/60 px-10 py-5 font-sans text-[11px] uppercase tracking-[0.28em] text-porcelain backdrop-blur-sm transition-colors duration-500 hover:text-[#0D1929]"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-[#C29B62] transition-transform duration-500 ease-out group-hover:scale-x-100" />
          <span className="relative flex">
            {FINALE.cta.split("").map((char, i) => (
              <motion.span
                key={i}
                variants={{ hide: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.5 + i * 0.025 }}
                className="inline-block whitespace-pre"
              >
                {char}
              </motion.span>
            ))}
          </span>
          <span className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
          {/* Hairline that draws itself under the label */}
          <motion.span
            aria-hidden="true"
            variants={{ hide: { scaleX: 0 }, show: { scaleX: 1 } }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.9 }}
            className="absolute inset-x-10 bottom-3 h-px origin-left bg-porcelain/40 group-hover:bg-[#0D1929]/40"
          />
        </Link>
      </motion.div>
    </motion.div>
  );
}

function StaticStory() {
  return (
    <section className="relative overflow-hidden bg-[#070d16] py-20 text-porcelain sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-square border border-porcelain/10">
          <Image src="/hero/grind.webp" alt="Exo Zilton porcelain mortar and pestle grinding whole spices" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">{STORY[0].title}</h1>
          <ul className="mt-10 space-y-8">
            {STORY.slice(1).map((chapter) => (
              <li key={chapter.eyebrow} className="border-l border-[#8F6E3E]/50 pl-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#C29B62]">{chapter.eyebrow}</p>
                <h2 className="mt-2 font-serif text-2xl font-light">{chapter.title}</h2>
                <p className="mt-2 font-sans text-[15px] leading-[1.7] text-porcelain/70">{chapter.body}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/products"
            onClick={() => track("story_shop_now")}
            className="mt-12 inline-flex border border-[#C29B62] px-10 py-5 font-sans text-[11px] uppercase tracking-[0.28em] text-porcelain transition-colors hover:bg-[#C29B62] hover:text-[#0D1929]"
          >
            {FINALE.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function GrindStory() {
  const reduceMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const compact = useMediaQuery("(max-width: 767px)", false);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  // Pause the WebGL render loop whenever the story is off-screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  if (reduceMotion) {
    return <StaticStory />;
  }

  return (
    <section ref={section} className="relative h-[600vh] bg-[#070d16] md:h-[650vh]" aria-label="The Exo Zilton grinding story">
      <div className="sticky top-0 h-svh overflow-hidden bg-[radial-gradient(ellipse_at_60%_45%,#1b2b42_0%,#0d1929_45%,#070d16_100%)] text-porcelain">
        <div
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${sceneReady ? "opacity-100" : "opacity-0"}`}
        >
          <GrindScene
            progress={scrollYProgress}
            active={active}
            compact={compact}
            onReady={() => setSceneReady(true)}
          />
        </div>
        {/* Vignette keeps the copy legible over the scene */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(7,13,22,0.75)_100%)]" />

        <div className="pointer-events-none absolute inset-0">
          {STORY.map((chapter, i) => (
            <ChapterCopy key={chapter.eyebrow} chapter={chapter} progress={scrollYProgress} index={i} />
          ))}
        </div>
        <ChapterRail progress={scrollYProgress} />
        <Finale progress={scrollYProgress} />
      </div>
    </section>
  );
}
