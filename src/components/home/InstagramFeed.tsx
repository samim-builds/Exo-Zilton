import Image from "next/image";
import Script from "next/script";
import { siteConfig, getInstagramUrl } from "@/lib/site";
import { instagramPosts, getInstagramPostUrl } from "@/lib/instagram";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InstagramGrid() {
  const profileUrl = getInstagramUrl();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
      {instagramPosts.map((post) => (
        <a
          key={post.id}
          href={getInstagramPostUrl(siteConfig.instagramHandle, post)}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-md bg-navy/20"
        >
          <Image
            src={post.image}
            alt={post.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-navy/0 transition-colors duration-300 group-hover:bg-navy/50">
            <InstagramIcon className="h-8 w-8 scale-75 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
          </div>
        </a>
      ))}
    </div>
  );
}

function ElfsightFeed() {
  if (!siteConfig.elfsightWidgetId) return null;

  return (
    <>
      <Script
        src="https://static.elfsight.com/platform/platform.js"
        strategy="lazyOnload"
      />
      <div className={`elfsight-app-${siteConfig.elfsightWidgetId}`} data-elfsight-app-lazy />
    </>
  );
}

export function InstagramFeed() {
  const profileUrl = getInstagramUrl();
  const useElfsight = Boolean(siteConfig.elfsightWidgetId);

  return (
    <section className="relative overflow-hidden bg-navy py-16 sm:py-20" aria-labelledby="instagram-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center text-center">
          <Image
            src="/brand/logo.png"
            alt=""
            width={120}
            height={120}
            className="mb-6 rounded-full"
            aria-hidden="true"
          />
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Stay Connected</p>
          <h2
            id="instagram-heading"
            className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl"
          >
            Follow our Instagram journey...
          </h2>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
          >
            <InstagramIcon className="h-5 w-5" />
            @{siteConfig.instagramHandle.replace(/^@/, "")}
          </a>
        </div>

        {useElfsight ? <ElfsightFeed /> : <InstagramGrid />}

        <div className="mt-10 flex justify-center">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-navy"
          >
            <InstagramIcon className="h-4 w-4" />
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

export { InstagramIcon };
