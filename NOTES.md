# Soundstage: project notes

The working notes for Soundstage: what it is, decisions made, the build plan and open
questions. Keep this current as the project moves. It started in Sage's job-search repo
(`sisyphus`, `loop/PORTFOLIO.md`) and moved here on 2026-10-28.

## What it is

Upload one song. AI separates it into stems. Each stem becomes an instrument on a 3D stage
you can move around, and you hear it move: left and right, near and far, in rooms that
sound different. Then describe the mix in plain language ("push the drums back, horns hard
left, vocal up front") and the instruments move themselves.

## Why it's worth building

- Draws directly on Boombox work: the stem splitter (one of its two most-used AI tools),
  AI features for musicians, and audio on the frontend.
- New territory alongside it: 3D (React Three Fiber) and spatial audio.
- AI-native in the way companies hiring now care about: the model returns typed actions,
  the app validates them, and only then applies them. This is the validation step the
  Boombox chord generator never had.
- Built on my own music, so everything is publishable and the demo shows my playing.
- First of three planned demos: Soundstage, then the overdub recorder, then Resonance.

## Decisions

- **Own repo**, public on GitHub when ready. Job-search notes stay in `sisyphus` (private).
- **Audio: my own songs only** for anything public. The current stems ("Shoulda Never", 7
  stems) are **placeholders from someone else's song**: local only, never committed.
  `public/audio/` is gitignored for this reason. Swap in my own stems before deploying.
- **Ship a demo song already separated**, so a recruiter hears music within a couple of
  seconds. Upload-and-separate is the second path: slow (tens of seconds to minutes), costs
  money per run, needs file-size limits and a progress UI.
- **Stack:** React, Vite, TypeScript, React Three Fiber (+ drei), Web Audio API directly
  (PannerNode with HRTF, ConvolverNode). Raw Web Audio over a wrapper: better interview story.
- **Dragging moves instruments along the floor plane.** The mouse ray is intersected with
  the floor, so screen X/Y maps to stage left/right and front/back with no depth guessing.
  The depth buffer handles draw order; the raycaster picks the nearest instrument under the
  cursor. Height is out of scope for now (maybe a modifier key later).
- **Distance changes the reverb, not just the volume.** Each stem has its own dry and wet
  levels, driven by its distance from the listener: farther away means quieter and wetter,
  like a real room. This is what makes "push the drums back" sound real.
- **Reverb starts with synthetic impulse responses** (shaped noise with a decay curve,
  generated from room size and wall material). No licensing questions, and parameters an AI
  can change ("make the room bigger"). Recorded IRs later, from a library with a clear
  license.
- **Rooms are built in 3D** (brick, wood, diffusers), not photo backdrops. The images in
  `reference/backgrounds/` are mood references from other sites; they're gitignored and
  never shipped.

## Build plan (simple to complex)

1. **Stage and drag.** 3D view of the stage, the stems as instruments, drag them around the
   floor with the mouse. All stems play in sync with a transport (play, pause, seek). Each
   stem panned in 3D (HRTF) relative to a listener at the front of the stage. One room, one
   reverb, distance-driven wet/dry.
2. **Rooms.** Choose a room (e.g. brick club, wood-and-diffusers studio, small booth, large
   hall). Each changes the 3D environment and the impulse response.
3. **AI mix moves.** Type an instruction; the model returns typed actions (move stem, set
   room, set level); the app validates them and animates the result. Server-side function
   holds the API key.
4. **Upload and separate.** One audio file in, stems out (an open-source model such as
   Demucs, hosted server-side; compare options and prices when we get here), with a
   progress UI while it runs.

## Status

**Step 1 done (2026-10-28).** `npm install`, then `npm run dev`.

- All stems load with a progress bar, then play in sync from one shared start time.
  Play, pause, seek, end of song and replay all work.
- Drag instruments around the floor. Each stem is folded to mono and placed with an HRTF
  panner; distance lowers the direct sound and raises the reverb send (checked: drums
  dragged from back center to front left went from 0.36 to 0.24 send).
- Synthetic studio reverb with a lowpass on the return. Reset stage puts everything home.
- Instruments glow and their floor rings pulse with each stem's level.
- Labels are a DOM overlay positioned each frame from 3D (drei's `Html` dropped labels
  at random, so it's gone). Phone widths widen the field of view so the stage fits.
- Verified in Chromium via Playwright: no console errors in dev or production build.
  Not yet checked: Safari, Firefox, a real phone with touch, and how it actually sounds,
  which needs Sage's ears and headphones.

**Step 2 done (2026-10-28).** Four rooms, picked from a panel
(top right on desktop, above the transport on phones):

| Room | Look | Reverb (tail, pre-delay, lowpass, wet) |
|---|---|---|
| Studio | wood walls and floor, quadratic residue diffusers (n² mod 7) | 1.4 s, 10 ms, 6.5 kHz, 0.30 |
| Brick club | brick, concrete floor | 1.2 s, 6 ms, 10 kHz, 0.40 |
| Concert hall | 14 m plaster walls, columns, much wider and deeper | 3.2 s, 35 ms, 5 kHz, 0.42 |
| Dead room | acoustic foam | 0.4 s, 2 ms, 3.5 kHz, 0.12 |

- Presets live in `src/rooms.ts` (sound and look together), textures are drawn on a canvas
  in `src/scene/surfaces.ts`, so there are no image assets.
- Switching rooms builds a new convolver chain and crossfades the returns over 0.35 s, so
  the old tail fades under the new room instead of clicking. Every stem's send is
  rescaled for the new room's wetness (checked: drums 0.34 in Studio, 0.45 in the club).
- Verified in Chromium, no console errors. Still needs ears: these values are first
  guesses.

**Known rough edges / next:**
- 18 MB of 320 kbps MP3 on first load. Re-encode smaller (ffmpeg is installed) before
  deploying; 128 to 160 kbps is plenty for a demo.
- Production JS bundle is about 1.2 MB (three.js). Fine for now; could code-split later.
- Instruments are colored cylinders. Real shapes or icons later.
- Tune by ear: room size, wet levels, distance rolloff.

## Ideas from Sage (original notes)

- Soundstage background: select different backgrounds to correspond to different reverbs:
  brick walls, wood walls and floor with sound diffusion, large vs. small space, etc.
- Can 3D instruments be moved on the soundstage by the user's mouse? How to deal with
  z-stacking? (Answered above: drag on the floor plane.)

## Assets

- `public/audio/shoulda-never/` (gitignored, placeholders, not my song): bass, drums,
  guitar, horns, keys, strings, vox. (Vinyl FX stem dropped 2026-10-28.) A fresh clone has no audio; copy the stems
  into that folder to run it.
  320 kbps MP3, 44.1 kHz stereo. Lengths vary from 56.4 s to 60.9 s.
- `reference/backgrounds/`: mood images, not for publishing.

## Open questions

- Do all stems start at 0:00, with the longer ones just carrying tails (horns, strings,
  vox, guitar)? Or were any bounced from a different start point?
- Stereo stems into a 3D panner: fold each to mono at its position (simplest, most
  convincing), or keep some width?
- Where the listener sits: fixed at front of house, or movable?
- Which model and host for stem separation (step 4).

## Hosting

Vercel (Hobby) for the app and the AI function; the API key lives in Vercel env vars, never
in the repo. Check current free-tier limits before relying on them.
