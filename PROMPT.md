# Atmospheric SVG Scene — Reusable Prompt

Paste everything between the `=== PROMPT START/END ===` markers into an LLM (Claude,
etc.), then add your brief (a filled-in copy of the **Brief template** at the bottom).
The model asks for anything required that you left blank (including which mood/concept
you want, if you didn't say), sketches the layout as text art for a quick check, then
returns a single self-contained animated `.svg`.

This repo's `assets/scene.svg` + `tools/build-books.mjs` are the reference implementation
of the output this prompt targets.

---

=== PROMPT START ===

## Role

You produce a single **self-contained animated SVG scene** for embedding in a GitHub
profile README (`<img src="scene.svg">`). It is an atmospheric illustration — a room,
a landscape, a diorama — with a permanent subtle "living" shimmer plus a few pieces of
deliberate motion. No build step, no runtime, no JavaScript.

**The concept is fully open.** This repo's reference file is a dim gothic study, but the
same techniques carry any setting — a sunlit cottage kitchen, a neon-rain noodle alley,
a flooded temple, a botanical greenhouse, a ship's cabin, a desert observatory at night,
an abstract field of drifting shapes. Do not default to gothic or to "dark". If the
requester's concept is vague, missing, or they explicitly ask for ideas, propose 2–3
distinct directions — each with a one-line mood, a rough palette, and a light setup —
and let them choose before you draw.

Write every piece of prose the requester will read — your clarifying questions, your
explanations, and inside the file the `<title>`, the `aria-label`, and all `<!-- -->`
comments — in the language the requester used to brief you. Keep element `id`s and
attribute values in ASCII.

## Hard constraints (never negotiable)

1. **One `.svg` file.** No external CSS/JS/font/image references. No `<script>`.
2. **Animation is SMIL only** — `<animate>`, `<animateTransform>`, `<animateMotion>`.
   GitHub strips scripts and does not run CSS animations inside `<img>`.
3. **Raster art is inlined** as `href="data:image/png;base64,…"`. Nothing is fetched.
4. **Fonts are web-safe stacks only**, e.g. `Georgia, 'Times New Roman', serif` or
   `-apple-system, Segoe UI, Roboto, sans-serif`. No `@font-face`, no Google Fonts.
5. **Fixed `viewBox="0 0 W H"`** with matching `width`/`height`. Work on an integer grid.
6. **Explicit background rect** as the first painted element (never rely on page color —
   the README renders on white *and* dark).
7. **Accessibility:** a `<title>` and a single descriptive `aria-label` on the root
   `<svg>` that narrates the whole scene (left→right, front→back).
8. **Back-to-front paint order:** far background → midground → subject → foreground →
   atmosphere overlays. Later elements paint on top.
9. **Motion budget:** the ambient shimmer is always on; deliberate motion is a *short*
   list (§Motion). Nothing should look busy or make the viewer seasick. Respect the
   requester's intensity setting.
10. Keep the file reasonable. Inlined PNGs dominate size — export subject art at the
    display resolution, not larger. State the final byte size when you deliver.

## Intake — resolve these before drawing

Ask the requester for any **REQUIRED** item they did not supply. For **OPTIONAL** items,
choose a default, proceed, and list the defaults you chose in your delivery notes.

REQUIRED
- **Concept & mood** — one or two sentences ("dim gothic study", "sunlit tidal marsh at
  dawn", "cyberpunk noodle stall in the rain"). Any setting is fine. If it's blank or
  vague, or the requester wants options, offer 2–3 concrete concept directions and let
  them pick before you proceed — do not just assume the gothic example.
- **Canvas** — pixel size / aspect and where it's used (profile banner ≈ 1200×640).
- **Light** — source, colour, direction (cand+hearth from the viewer's side; cold
  window light from upper-left). Drives every glow and shadow.
- **Must-have objects** — the specific props/architecture that have to be in frame.
- **Subject/character** — none, a vector figure, or supplied raster art. If art is
  supplied: which parts move (eyes, etc.) and whether those parts are separable layers.
- **Palette direction** — 3–5 anchor colours, or "you choose" + a vibe.
- **Animation intensity** — subtle / medium / strong, and ambient shimmer on/off.

OPTIONAL (defaults in brackets)
- Individual motion periods [pendulum 2s, second-hand 60s, ember rise 12–19s, subject
  breathing 8–10s, parallax 20–24s].
- File-size ceiling [none, but flag if > 600 KB].
- Light/dark parity requirement [always design for both].
- Whether you may write the `aria-label` [yes].
- A derivative config-driven build (link shelf, badge row, …) and its data schema [no].
- Existing assets to reuse — reference images, a fixed coordinate spec, brand colours,
  a previous version of the file.

## Procedure

**1 — Coordinate spec.** Fix `viewBox`. Write down, as numbers, the horizon / ground
line, the y-bands for background vs midground vs foreground, and the x-range reserved
for the subject. Every later shape references these.

**2 — Layout blocking (text art).** Before drawing anything real, rough out the
composition as an ASCII / box diagram at roughly the `viewBox` proportions. Mark the
ground or horizon line, the major masses (architecture, furniture, the subject slot),
the light source and its direction, and the reserved subject x-range. Label every block
and tag its depth (BG / MID / FG). Show this to the requester and get a nod — or fold in
their changes — before continuing: moving a box now is free, re-cutting paths later is
not. Keep it crude; it is a plan, not art. Example:

```
+-------------------------------------------------------------+
| BG  wall + crown molding                 [ frame ] [frame]  |
|     __________                                              |
|    /  arched   \   [| tall clock |]                         |
|    | niche:    |      \ pendulum /                          |
|  MID  jars  lamp  flasks                                    |
|       [ book  book  book ]                                  |
|   * light: candles, front-left, warm *      ###########     |
|                                             #  SUBJECT #    |
|  FG  ===========  bar counter (overhangs)  ==###########    |  <- subject x: 820-1075
|        (O) stool      (O) stool      (O) stool              |
+-------------------------------------------------------------+
```

**3 — Palette tokens.** Choose 3–4 darkness/base steps (for gradients) + 1–2 light
colours + 1 accent. Treat them as named constants and reuse them; do not sprinkle
one-off hexes.

**4 — `<defs>`.**
- *Gradients:* wall/ground, a radial light-glow, a vignette, a bottom fade.
- *Shimmer filter set* — 3–5 variants, one per material class (see §Shimmer):
  weak (architecture), strong (loose objects), flame (fast, vertically stretched),
  subject (displacement **plus** a drop shadow), grain (high-freq, no displacement).
- *Reusable symbols:* anything repeated (a panel, a stool, a picture frame, the flame)
  as `<g id="…">` referenced by `<use>`.

**5 — Draw back-to-front.** Wrap each group in the shimmer filter for its material:
`<g filter="url(#wigArch)"> … </g>`. Keep a tall fixed object (a clock, a lamppost)
*inside* the background group so it shimmers in sync with the wall behind it.
For vector props: a soft contact-shadow ellipse at the base, a near-black stroke
(`#160d08`-ish) for edges, thin light strokes for highlights, a glow ellipse behind
anything that emits light.

**6 — Subject.** Raster: inline the base PNG with `<image>`; inline each moving part as
a separately-cropped PNG stacked at the same x/y, and give each part its own parallax
`translate` — same period and keyTimes, amplitude scaled by depth (irises travel most,
lids/whites least). Add one slow whole-body vertical float. Vector: same idea with
grouped paths.

**7 — Motion pass.** List what genuinely moves, then animate each with
`animateTransform`/`animate` (NOT the filter): pendulum (rotate, spline ease-in-out,
`additive="sum"`), clock hands (separate durations), rising embers (`cy` + `opacity`),
subject breathing, eye parallax. Everything else only gets the ambient shimmer.

**8 — Atmosphere overlays**, painted last, in this order: a full-frame light-wash rect,
a large soft glow ellipse near the light source, a faint warm rect, a faint black rect,
the vignette rect, the grain rect (`opacity` ≈ 0.1), then a handful of drifting ember
circles.

**9 — `aria-label` + `<title>`.** Narrate the finished scene in one sentence.

**10 — Self-check** (do this before delivering — see §Checklist).

**11 — Derivative build (only if asked).** Do not hand-place repeating data (project
links, badges) in the scene. Emit a `<name>.config.json` + a zero-dependency
`build-<name>.mjs` that reads the config and writes the fragment SVGs and the README
block. Mirror `tools/build-books.mjs`: pure Node, no imports beyond `node:*`.

## Shimmer — the "living" effect

Perlin noise displaces the pixels; animating the noise `seed` in discrete steps makes
the displacement jump each frame → a wriggle. The graphic itself has no animation.

```xml
<filter id="wigArch" x="-6%" y="-6%" width="112%" height="112%">
  <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="2" result="n">
    <animate attributeName="seed" values="2;6;9;13" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3.6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

Tuning:
- `baseFrequency` ↑ = finer, more nervous ripple. `scale` = displacement amplitude in px.
- Expand the filter region (`x/y/width/height`) so displaced pixels are not clipped —
  more expansion for bigger `scale`.
- `dur` = shimmer speed. Discrete `seed` steps must be *different* integers.
- Anisotropic `baseFrequency="0.06 0.11"` (more vertical detail) reads as flame/heat.

Reference variants:

```xml
<!-- loose objects: stronger -->
<filter id="wigObj" x="-16%" y="-16%" width="132%" height="132%">
  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="n">
    <animate attributeName="seed" values="7;3;12;1" dur="0.4s" calcMode="discrete" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>

<!-- flame: fast, vertically stretched noise -->
<filter id="wigFlame" x="-70%" y="-70%" width="240%" height="240%">
  <feTurbulence type="fractalNoise" baseFrequency="0.06 0.11" numOctaves="2" seed="1" result="n">
    <animate attributeName="seed" values="1;2;3;4;5;6" dur="0.26s" calcMode="discrete" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>

<!-- subject: displacement + a cast drop shadow baked into the same filter -->
<filter id="charFx" x="-22%" y="-16%" width="152%" height="156%">
  <feTurbulence type="fractalNoise" baseFrequency="0.021" numOctaves="2" seed="5" result="n">
    <animate attributeName="seed" values="5;11;3;14" dur="0.44s" calcMode="discrete" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="disp"/>
  <feColorMatrix in="disp" type="matrix"
    values="0.5 0 0 0 0.02  0 0.44 0 0 0.012  0 0 0.36 0 0  0 0 0 1 0" result="lit"/>
  <feFlood flood-color="#0c0605" result="shcol"/>
  <feComposite in="shcol" in2="disp" operator="in" result="shsil"/>
  <feOffset in="shsil" dx="7" dy="10" result="shoff"/>
  <feComponentTransfer in="shoff" result="shf"><feFuncA type="linear" slope="0.42"/></feComponentTransfer>
  <feMerge><feMergeNode in="shf"/><feMergeNode in="lit"/></feMerge>
</filter>

<!-- film grain: high-freq noise, no displacement, painted as a full-frame rect -->
<filter id="grain" x="0%" y="0%" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" seed="3" result="g">
    <animate attributeName="seed" values="3;9;16;24" dur="1.3s" calcMode="discrete" repeatCount="indefinite"/>
  </feTurbulence>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.56  0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0.34 0"/>
</filter>
```

## Motion patterns

```xml
<!-- pendulum / hanging sign: eased swing about a pivot, layered on top of the element's own transform -->
<g transform="translate(0 224)">
  <animateTransform attributeName="transform" type="rotate" values="3.2;-3.2;3.2" dur="2s"
    calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
    repeatCount="indefinite" additive="sum"/>
  <!-- rod + bob -->
</g>

<!-- clock hands: three independent rotations -->
<animateTransform attributeName="transform" type="rotate" from="60 0 0" to="420 0 0" dur="3600s" repeatCount="indefinite"/>   <!-- minute -->
<animateTransform attributeName="transform" type="rotate" from="305 0 0" to="665 0 0" dur="43200s" repeatCount="indefinite"/> <!-- hour -->
<animateTransform attributeName="transform" type="rotate" calcMode="discrete"
  values="0;6;12;18;24;30;36;42;48;54;56;…;354" dur="60s" repeatCount="indefinite"/>                                        <!-- ticking second -->

<!-- rising embers -->
<g fill="#ffdca0">
  <circle cx="430" cy="300" r="1.5">
    <animate attributeName="cy" values="380;150" dur="15s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;0.5;0" dur="15s" repeatCount="indefinite"/>
  </circle>
  <!-- 3–5 more, staggered begin= and varied dur= -->
</g>

<!-- subject breathing -->
<animateTransform attributeName="transform" type="translate"
  values="0 0; 0 -3.5; 0 0; 0 1.8; 0 0" keyTimes="0;0.28;0.5;0.75;1"
  calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
  dur="10s" repeatCount="indefinite"/>

<!-- eye parallax: same block on each cropped layer, amplitude scaled by depth.
     Pairs of repeated values = a hold at that offset. -->
<animateTransform attributeName="transform" type="translate"
  values="0 0;6 1;6 1;-4.8 -2.2;-4.8 -2.2;1.2 3.8;1.2 3.8;0 0"
  keyTimes="0;0.13;0.32;0.44;0.62;0.74;0.89;1" calcMode="spline"
  keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
  dur="22s" repeatCount="indefinite"/>
```

## Atmosphere stack (painted last)

```xml
<radialGradient id="vig" cx="0.48" cy="0.46" r="0.9">
  <stop offset="0"    stop-color="#000" stop-opacity="0"/>
  <stop offset="0.38" stop-color="#000" stop-opacity="0.04"/>
  <stop offset="0.64" stop-color="#000" stop-opacity="0.27"/>
  <stop offset="0.82" stop-color="#000" stop-opacity="0.62"/>
  <stop offset="1"    stop-color="#000" stop-opacity="0.92"/>
</radialGradient>
…
<rect width="W" height="H" fill="url(#frontLight)"/>              <!-- directional light wash -->
<ellipse cx="…" cy="…" rx="…" ry="…" fill="url(#hearthGlow)"/>    <!-- soft glow at the source -->
<rect width="W" height="H" fill="#ff9c3e" opacity="0.016"/>       <!-- warm unifying tint -->
<rect width="W" height="H" fill="#000"    opacity="0.165"/>       <!-- overall level -->
<rect width="W" height="H" fill="url(#vig)"/>                     <!-- vignette -->
<rect width="W" height="H" filter="url(#grain)" opacity="0.12"/>  <!-- grain -->
<!-- then the drifting ember circles -->
```

## Checklist before delivering

- [ ] Concept was confirmed (or options were offered) before drawing.
- [ ] Layout text-art diagram was shown and its final version matches the scene.
- [ ] Opens standalone in a browser and animates.
- [ ] Legible on **white and on dark** — background rect is explicit; contrast holds.
- [ ] No external refs; no `<script>`; raster inlined; fonts are web-safe stacks.
- [ ] `viewBox` + `width` + `height` present and consistent.
- [ ] `<title>` + descriptive `aria-label` on root `<svg>`.
- [ ] Shimmer `scale` not so high that edges tear or text smears.
- [ ] Deliberate motion is a short list; ambient shimmer respects the intensity setting.
- [ ] Filter regions expanded enough that nothing clips.
- [ ] Report the final file size and list every default you chose.

## Deliver

1. The complete `assets/scene.svg`.
2. A short notes block: defaults chosen, file size, how to tune shimmer intensity
   (`scale` / `dur`) and motion periods.
3. The README embed snippet:
   `<div align="center"><img src="assets/scene.svg" width="100%"/></div>`
4. If a derivative build was requested: `tools/<name>.config.json`,
   `tools/build-<name>.mjs`, and its one-line run command.

=== PROMPT END ===

---

## Brief template

```
Concept & mood:   (describe one, or leave blank / write "suggest a few" to get 2–3 options first)
Canvas (px / aspect / use):
Light (source, colour, direction):
Must-have objects:
Subject/character: (none | vector | raster attached)  — moving parts:  — separable layers? (y/n)
Palette: (3–5 hexes | "you choose" + vibe)
Animation intensity: (subtle | medium | strong)   Ambient shimmer: (on | off)

Optional —
  Motion periods:
  File-size ceiling:
  Light/dark parity: (default: both)
  May you write the aria-label? (default: yes)
  Derivative build wanted? (default: no)  — data schema:
  Existing assets to reuse:
```

## Example brief (this repo)

```
Concept & mood: A dim gothic-manor study wall, seen from behind a bar counter. Warm and quiet.
Canvas: 1200×640, GitHub profile banner.
Light: cand+hearth glow from the viewer's side, brightest at centre, falling off to the edges.
Must-have objects: built-in arched bookshelf niche, tall longcase (grandfather) clock,
  jars / corked flasks / a standing gas lamp on the shelves, thick 3D foreground bar counter,
  3 bar stools, candelabra + writing setup on the counter.
Subject/character: raster attached (base.png) — eyes move — separable layers yes
  (eye_top / eye_middle / eye_bottom).
Palette: near-black warm browns (#2a1210 → #0a0403), candle amber (#ffca78 / #ff852c), gold accent.
Animation intensity: subtle. Ambient shimmer: on.
Derivative build wanted: yes — a horizontal bookshelf strip of project links.
  Schema: { slug, title, url, cover, style: banded|label|ruled|plain, height }.
```

## Example brief (different concept)

```
Concept & mood: suggest a few — I want something bright and calm, not dark.
Canvas: 1200×400, profile banner.
Light: you choose to fit the concept.
Must-have objects: somewhere my name could sit; a couple of small living/moving details.
Subject/character: none.
Palette: you choose + soft, low-contrast.
Animation intensity: subtle. Ambient shimmer: on.
```
→ the model replies with 2–3 directions (e.g. "a sunlit windowsill of potted plants",
"a tide pool at low sun", "a paper-cut mountain valley with drifting mist"), the
requester picks one, then it blocks out the layout as text art and proceeds.
