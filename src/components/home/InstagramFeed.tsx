import Image from "next/image";
import Script from "next/script";
import { buttonVariants } from "@/components/site/Button";
import { siteConfig } from "@/lib/site";
import { instagramUrl } from "@/lib/cms/settings";
import type { SectionData } from "@/lib/cms/sections";

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

function InstagramGrid({ handle, posts }: { handle: string; posts: SectionData<"instagram-feed">["posts"] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6">
      {posts.filter((post) => post.image).map((post, index) => (
        <a
          key={index}
          href={post.href || instagramUrl(handle)}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-[2px] bg-glaze"
        >
          <Image
            src={post.image}
            alt={post.alt}
            fill
            className="object-cover transition-opacity duration-300 group-hover:opacity-85"
            sizes="(max-width: 1024px) 33vw, 16vw"
          />
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

export function InstagramFeed({ data, handle }: { data: SectionData<"instagram-feed">; handle: string }) {
  const profileUrl = instagramUrl(handle);
  const useElfsight = Boolean(siteConfig.elfsightWidgetId);

  return (
    <section className="bg-porcelain py-20 sm:py-28" aria-labelledby="instagram-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {data.eyebrow && <p className="text-sm font-medium text-bronze">{data.eyebrow}</p>}
            <h2 id="instagram-heading" className="mt-3 text-3xl text-ink sm:text-4xl">
              {data.title}
            </h2>
          </div>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", className: "self-start sm:self-auto" })}>
            <InstagramIcon className="size-4" />@{handle.replace(/^@/, "")}
          </a>
        </div>

        {useElfsight ? <ElfsightFeed /> : <InstagramGrid handle={handle} posts={data.posts} />}
      </div>
    </section>
  );
}

export { InstagramIcon };
