"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import type { SectionData } from "@/lib/cms/sections";

export function ScrollStorytelling({ data }: { data: SectionData<"scroll-story"> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax subtle rotation & vertical float
  const y = useTransform(scrollYProgress, [0, 1], [-20, 40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.02, 0.98]);

  return (
    <section ref={containerRef} className="relative bg-[#0D1929] text-[#F9F8F5] py-24 sm:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-xl mx-auto mb-20"
        >
          <span className="text-[11px] font-sans uppercase tracking-[0.3em] text-[#C29B62]">
            {data.eyebrow}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal mt-3 tracking-tight">
            {data.title}
          </h2>
        </motion.div>

        {/* 2-Column Split: Scrolling Text on Left, Pinned Image on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Sequential Story Cards */}
          <div className="lg:col-span-6 space-y-28 sm:space-y-40 py-10">
            {data.pillars.map((item, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.6 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="border-l border-[#8F6E3E]/40 pl-6 sm:pl-8"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono text-[#C29B62] font-medium">{item.step}</span>
                  <span className="text-[10px] font-sans tracking-[0.25em] text-[#F9F8F5]/60 uppercase">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#F9F8F5] leading-snug">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm sm:text-base text-[#F9F8F5]/70 leading-relaxed font-sans max-w-md">
                  {item.body}
                </p>
              </motion.article>
            ))}
          </div>

          {/* Right Column: Sticky Pinned Visual Container */}
          <div className="lg:col-span-6 lg:sticky lg:top-32 self-start">
            <motion.div
              style={{ y, scale }}
              className="relative aspect-square w-full rounded-sm overflow-hidden border border-[#F9F8F5]/10 bg-[#16253B] shadow-2xl"
            >
              <Image
                src={data.image}
                alt={data.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              
              {/* Subtle ambient luxury badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] uppercase tracking-widest text-[#F9F8F5]/60 backdrop-blur-xs">
                <span>{data.badgeLeft}</span>
                <span>{data.badgeRight}</span>
              </div>
            </motion.div>
          </div>

        </div>

      </div>
    </section>
  );
}
