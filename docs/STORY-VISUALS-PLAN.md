# Real-Looking Grind Story: Production Plans

Two ways to replace the current code-drawn 3D scene with real-looking visuals while keeping the **same scroll-driven story**: the pinned stage, the six chapters, the copy and the **Shop the Collection** finale.

- **Method A: film it for real**
- **Method B: generate it with AI** (Google Flow / Veo)

Both produce the same kind of deliverable (a set of video clips), and the website integration is identical. It's covered once, at the end.

---

## The story both methods must deliver

These chapters match the current site timings in `src/components/story/timeline.ts`. Each one is a separate clip that **ends exactly where the next one begins**.

| # | Chapter | Scroll range | What the viewer sees | Target clip length |
|---|---|---|---|---|
| 1 | Intro | 0–12% | Empty mortar emerges from darkness; warm rim light fades up | 3–4 s |
| 2 | Whole spices | 12–32% | Peppercorns, green cardamom, cumin, dried chilli and a cinnamon shard fall in and settle | 4–6 s |
| 3 | Matte bisque interior | 32–55% | Pestle enters and grinds in steady circles; seeds crack and tumble | 5–7 s |
| 4 | Vitrified at 1,300°C | 55–75% | Seeds break down into powder; faint aromatic dust rises | 4–6 s |
| 5 | Beechwood grip | 75–90% | Pestle lifts out and is laid beside the mortar; high view of the finished powder | 3–5 s |
| 6 | Finale | 90–100% | Hero shot: pestle resting in the bowl of powder (the Shop button appears over it) | 2–3 s |

**Total: about 20–30 seconds of footage → about 240–300 frames on the site.**

### Framing rules (both methods)
- **Desktop version (16:9):** keep the mortar in the **right third** of the frame. The left 40% must be dark and calm, because chapter text sits there.
- **Phone version (9:16 or 4:5):** mortar centred in the **top half**; the bottom 45% stays dark for the text.
- **Intro and finale:** mortar centred, with space **above** it (intro headline) and **below** it (finale headline and button).
- **Background:** deep navy to black (`#0D1929` → `#070D16`), so the footage blends with the site with no visible edge.
- **Light:** soft key light from the top-left, plus a **warm bronze rim light from behind** (the brand accent `#C29B62`).
- **Consistency:** the camera angle, exposure and colour must match where clips meet, or the scroll will visibly "jump".

---

## Method A: Film it for real

**Best for:** the most authentic result, showing your actual product.
**Rough cost:** $0–400 if you shoot it yourself with gear you own or rent, or $500–2,000 for a local product videographer.
**Time:** 1 day of preparation, 1 day of shooting, 1–2 days of editing.

### A1. Equipment

| Item | Minimum | Better |
|---|---|---|
| Camera | Recent iPhone / Pixel / Galaxy in Pro mode, 4K | Mirrorless camera (Sony / Canon / Fuji) shooting 4K, 10-bit if available |
| Lens | Phone main camera (avoid digital zoom) | 90–100 mm macro + 35 mm for wide shots |
| Support | Sturdy tripod | Tripod + motorised slider for smooth, repeatable moves |
| Lights | 2 LED panels with diffusion | 3 lights: key softbox, fill, and a warm rim light (with a CTO gel or set to 3200K) |
| Backdrop | Black velvet or matte black card | Navy/black velvet sweep plus a dark slate or wood surface |
| Extras | Black card to block reflections, gaffer tape | Speed-ramp-capable editing software, a remote shutter |

### A2. Camera settings
- **Resolution:** 4K (3840×2160). Shoot a separate vertical version for phones, or frame wide enough to crop one out.
- **Frame rate:** 24/25 fps for normal moves; **120 fps** for the spice drop (chapter 2) and the dust (chapter 4), for luxurious slow motion.
- **Shutter:** double the frame rate (1/50 at 25 fps, 1/250 at 120 fps).
- **Lock everything:** manual focus, manual exposure, fixed white balance (around 4500K), and no auto-stabilisation drift. Any automatic adjustment shows up as a flicker when scrolling.
- **Colour:** shoot flat or log if you can, then grade every clip together so they match.

### A3. Prep
- Use **your actual product**, cleaned, with no dust, fingerprints or scratches. Steam or wipe the porcelain right before shooting.
- **Spices:** buy fresh, whole, good-looking ones. Pick out broken seeds, and keep 3–4 batches so you can redo takes.
- **Pre-ground backup:** keep a bowl of finely ground masala ready. If real grinding on camera looks messy, swap it in between takes (this is standard in food filming).
- **Hands:** if hands appear, use one person with clean, neutral nails, in a dark sleeve or with the arm kept out of frame.
- Mark the mortar's position and every camera position with tape, so retakes line up exactly.

### A4. Shot list

| Shot | Chapter | Setup | Direction |
|---|---|---|---|
| A-1 | Intro | Tripod, slight high angle, mortar right third | Start in darkness and fade the lights up over 3 s, or do a slow 5 cm push-in on the slider |
| A-2 | Spices | Same angle, 120 fps | Drop the spices from just above the frame in 2–3 small batches; film several takes and pick the best bounce and settle |
| A-3 | Grind | Same angle | Pestle enters from top-right; 4–5 steady, unhurried circles. Keep the speed even. Take a 10–20 s take so there's room to edit |
| A-4 | Powder | Slightly closer and higher | Continue grinding; backlight the rising dust with the rim light. Speed up in the edit if needed |
| A-5 | Reveal | Pestle lifted and laid down; then a top-down shot | Lift out slowly, lay the pestle on the surface with the handle running diagonally away; cut or slide to the top-down powder view |
| A-6 | Finale | Three-quarter hero angle, centred | Pestle resting in the bowl, leaning on the rim; hold perfectly still for 3 s |
| A-V | Phone versions | Repeat key shots in vertical framing | At minimum, re-shoot A-1, A-3 and A-6 vertically |

### A5. Edit
1. Trim each shot so it **ends on the exact frame the next shot starts on** (use crossfades or match cuts where needed).
2. Speed-ramp: normal → slow motion on the spice drop → normal; speed up the long grind.
3. Grade all clips together: deep blacks, warm highlights, porcelain clean white (not blue).
4. Export **one continuous master** per format (16:9 and 9:16), ProRes or high-bitrate H.264/H.265, 4K, with no music or titles.

### A6. Risks and fixes

| Risk | Fix |
|---|---|
| Flicker or exposure jumps | Everything on manual; avoid mixed light sources |
| Grinding looks messy or slow | Swap in pre-ground powder between takes; speed up in the edit |
| Reflections on porcelain | Black cards around the set; move the key light higher |
| Clips don't line up | Tape marks, a slider with memorised positions, and a locked tripod |

---

## Method B: Generate with AI (Google Flow / Veo)

**Best for:** no studio or camera, fast experimenting, cinematic slow-motion spice shots.
**Rough cost:** a Google AI subscription that includes Flow (check current plans and credit limits); budget for **many** generations.
**Time:** 2–5 days of generating and selecting.

> **Product-accuracy rule:** the mortar and pestle in every frame must match the product customers will receive (shape, rim, size, colour, handle). Reject any clip where the AI alters it. Showing a product that differs from what you sell would mislead buyers.

### B1. Before you start
- **Check your plan's terms:** commercial-use rights, the output resolution available, any visible watermark, and credit limits. Google also embeds an invisible SynthID watermark; that's fine for a website.
- **Photograph your real product** (see B2). These photos anchor every generation.
- Make a folder per chapter to track generations, picks and rejects.

### B2. Reference photos (the most important step)
Shoot with a phone on a tripod, in the lighting described above:
1. Empty mortar with pestle beside it: desktop framing (mortar right third), 16:9.
2. Same, phone framing (centred, top half), 9:16.
3. Close-up three-quarter angle of the mortar (rim and interior visible).
4. Pestle alone, so the model sees the beechwood grain and the porcelain head.
5. Top-down view into the empty bowl.

Sharp focus, no clutter, dark background, high resolution.

### B3. Create the six keyframe stills first
Use the image tool in Flow (or Gemini image editing) to edit **reference photo 1** into the moment where each chapter starts and ends. Keep the **same angle and lighting** in every still:

| Still | Moment |
|---|---|
| S0 | Empty mortar, dramatic dark lighting (start of the intro) |
| S1 | Empty mortar, fully lit with bronze rim light (intro end = spices start) |
| S2 | Whole spices settled in the bowl (spices end = grind start) |
| S3 | Pestle in the bowl, seeds partly crushed (grind end = powder start) |
| S4 | Fine masala powder in the bowl, pestle still in it (powder end = reveal start) |
| S5 | Powder in the bowl, pestle lying beside the mortar (reveal end) |
| S6 | Finale hero: pestle resting in the bowl of powder (finale) |

Check every still against your real product before moving on.

### B4. Animate between stills
Use Flow's **start-frame → end-frame** generation for each pair, so every clip begins exactly where the previous one ended:

| Clip | Start → End | Prompt direction |
|---|---|---|
| B-1 | S0 → S1 | "Studio lights slowly fade up on a white porcelain mortar, warm bronze rim light behind, locked-off camera, dark navy background, macro product cinematography" |
| B-2 | S1 → S2 | "Whole black peppercorns, green cardamom pods, cumin seeds, a dried red chilli and a cinnamon stick fall in slow motion into the porcelain mortar and settle, locked-off camera, macro, studio lighting" |
| B-3 | S2 → S3 | "A porcelain pestle with a beechwood handle lowers into the mortar and grinds in slow steady circles, seeds cracking, no hands visible, locked-off camera" |
| B-4 | S3 → S4 | "Grinding continues until the spices become fine reddish-brown masala powder, faint aromatic dust rises and catches the warm rim light, locked-off camera" |
| B-5 | S4 → S5 | "The pestle lifts out of the mortar and comes to rest on the dark surface beside it, slow and elegant, locked-off camera" |
| B-6 | S5 → S6 | "The pestle settles to rest inside the bowl, leaning on the rim, subtle slow camera push-in, premium product hero shot" |

**Prompt tips**
- Always say **"locked-off camera"** or describe one exact slow move. Vague prompts produce camera drift that won't line up between clips.
- Say **"no hands visible"** unless you want hands; AI hands are often wrong.
- Repeat the product description word for word in every prompt: *"white unglazed porcelain mortar with a rolled rim, porcelain pestle with a turned beechwood handle"*.
- Ask for no text, logos or captions.
- Generate **4–8 versions per clip**, then keep the one with correct physics and an unchanged product.
- Repeat the whole set in **9:16** for phones, or generate wide enough to crop.

### B5. Quality checklist (reject the clip if any are true)
- [ ] The mortar's shape, rim, colour or size changes at any point
- [ ] The pestle passes through the bowl or spices
- [ ] The amount of spice jumps, or powder appears from nowhere
- [ ] Hands or fingers look distorted
- [ ] Lighting or colour visibly changes where clips meet
- [ ] A visible watermark, text or artefacts appear

### B6. Finish
1. Join the chosen clips in a video editor and check that every boundary is seamless.
2. Colour-match all clips (blacks, warmth, porcelain white).
3. Upscale to 4K if the generator's output is lower resolution (use an AI upscaler and check the result for artefacts).
4. Export one master per format (16:9 and 9:16), with no music or titles.

### B7. Recommended hybrid
Use **AI for chapters 2–4** (spice drop, grinding, dust, which are hard to film and look great generated) and **real photos or footage for chapters 1 and 6** (the hero shots buyers study most closely). That guarantees the product people judge is exactly yours.

---

## Website integration (same for both methods)

What I need from you:
- `story-desktop.mp4`: 16:9, 4K or 1080p minimum, about 20–30 s
- `story-mobile.mp4`: 9:16, 1080×1920 minimum
- Optionally, the timestamps where each chapter starts, so the copy lines up exactly

What I'll build:
1. **Frame extraction:** convert each master into about 240–300 frames with ffmpeg:
   - Desktop: 1600px wide, AVIF with a WebP fallback, about 40–80 KB per frame
   - Mobile: 800px wide, about 20–40 KB per frame
   - Uploaded to Vercel Blob or `/public`, so they're served from the CDN
2. **Frame player:** a `<canvas>` that draws the frame matching the scroll position. It replaces `GrindScene`; the pinned section, chapter copy, chapter rail, finale CTA and reduced-motion fallback all stay as they are.
3. **Loading:** the first frame shows instantly, the frames for the first chapter load next, and the rest stream in the background. A placeholder frame is drawn if the visitor scrolls ahead of the download.
4. **Chapter timing:** retune `src/components/story/timeline.ts` to match the actual footage.
5. **Responsive:** load the desktop or mobile frame set by screen orientation.
6. **Keep or retire the 3D scene:** keep it as a fallback, or remove three.js to save about 267 KB.

Expected download: about **8–15 MB on desktop and 4–8 MB on mobile**, loaded progressively. The page stays usable straight away.

## Recommended next step
Do a **test of chapter 3 only** (the grinding) with whichever method you prefer: about 5–7 seconds, desktop framing. Send it over and I'll wire it into the site as a scroll-scrubbed sequence, so you can feel the result before producing the whole story.
