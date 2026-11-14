import { CHAPTERS } from "./timeline";

export type StoryChapter = {
  range: readonly [number, number];
  eyebrow: string;
  title: string;
  body?: string;
};

export const STORY: StoryChapter[] = [
  {
    range: CHAPTERS.intro,
    eyebrow: "Exo Zilton · Porcelain Mortar & Pestle",
    title: "Flavour is released, not bought.",
    body: "Scroll to grind.",
  },
  {
    range: CHAPTERS.spices,
    eyebrow: "01 · Whole Spices",
    title: "Every seed is sealed with its own oils.",
    body: "Pre-ground spice loses its aroma within weeks. Whole peppercorn, cardamom and cumin hold it until the very moment you crush them.",
  },
  {
    range: CHAPTERS.grind,
    eyebrow: "02 · Matte Bisque Interior",
    title: "A surface that grips, so nothing skates.",
    body: "Glazed bowls let hard seeds bounce and slide. Our unglazed interior has a fine natural tooth that holds each spice under the pestle and shears it clean.",
  },
  {
    range: CHAPTERS.powder,
    eyebrow: "03 · Vitrified at 1,300°C",
    title: "Non-porous. It never keeps yesterday's garlic.",
    body: "Fired until the clay turns to dense glass, it absorbs no oils, stains or odours — unlike granite, marble or wood. Every blend tastes only of itself.",
  },
  {
    range: CHAPTERS.reveal,
    eyebrow: "04 · Turned Beechwood Grip",
    title: "Porcelain weight. Warm, balanced leverage.",
    body: "The heavy porcelain head does the work; the beechwood handle keeps your wrist relaxed through every round of masala.",
  },
];

export const FINALE = {
  eyebrow: "Hand-finished in Pakistan · Shipped worldwide",
  title: "Grind it fresh. Taste the difference.",
  cta: "Shop the Collection",
};
