export type InstagramPost = {
  id: string;
  image: string;
  alt: string;
  href?: string;
};

export const instagramPosts: InstagramPost[] = [
  {
    id: "1",
    image: "/hero/grind.webp",
    alt: "Grinding spices with Exo Zilton mortar and pestle",
  },
  {
    id: "2",
    image: "/hero/crush.webp",
    alt: "Crushing fresh ingredients in the kitchen",
  },
  {
    id: "3",
    image: "/products/size-0/front.webp",
    alt: "Exo Zilton porcelain mortar and pestle Size 0",
  },
  {
    id: "4",
    image: "/products/size-2/front.webp",
    alt: "Exo Zilton mortar and pestle Size 2",
  },
  {
    id: "5",
    image: "/packaging/box-front.webp",
    alt: "Exo Zilton gift-ready packaging",
  },
  {
    id: "6",
    image: "/hero/craft.webp",
    alt: "Timeless heritage mortar and pestle design",
  },
];

export function getInstagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}

export function getInstagramPostUrl(handle: string, post?: InstagramPost): string {
  return post?.href ?? getInstagramProfileUrl(handle);
}
