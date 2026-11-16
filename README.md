# Soundstage

A song split into stems, with each stem placed as an instrument on a 3D stage. Drag the
instruments around and you hear them move: left and right, near and far. Switch between
four rooms (Studio, Brick club, Concert hall, Dead room) and the reverb changes with the room.

**Live:** https://soundstage.sagebaggott.com

Built with React, TypeScript, Vite, React Three Fiber and the Web Audio API.

## Running it

```
npm install
npm run dev
```

## Deploying

The live site is a Cloudflare Worker that serves the built files, set up in
`wrangler.jsonc`. Pushing to GitHub doesn't deploy anything; deploys are run by hand.

1. Log in to Cloudflare once per machine, with the account that has `sagebaggott.com`:

   ```
   npx wrangler login
   ```

2. Build and deploy:

   ```
   npm run deploy
   ```

   This runs a production build into `dist/` and uploads it. The change is live at
   https://soundstage.sagebaggott.com within a few seconds. Only changed files are
   uploaded, so later deploys are quicker than the first.

To undo a bad deploy, `npx wrangler rollback` goes back to the previous version. For an
older one, find its ID with `npx wrangler versions list` and run
`npx wrangler rollback <version-id>`.

## Credits

### Music

"She's Seated At The Table" by [Sage Baggott](https://sagebaggott.com).

Thanks to everyone below for sharing their work.

### 3D models

All from Sketchfab, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Every model was compressed for the web (meshopt geometry, WebP textures). Other changes are
listed with each one.

| Used for | Model | Author | Changes |
|---|---|---|---|
| Drums | [Drum Kit](https://sketchfab.com/3d-models/drum-kit-898f2f4ba1704abe9c784066e2b0f751) | art.katja | Removed the floor mat and a spare cymbal. New chrome and bronze materials. |
| Bass | [Electric bass](https://sketchfab.com/3d-models/electric-bass-c5927d3f189c4e2595078020ba84d305) | Nixak | |
| Electric Guitar | [Fender Stratocaster Guitar Blue](https://sketchfab.com/3d-models/fender-stratocaster-guitar-blue-96a79610434f43b2ac2a09a636afc5d4) | YieldingMist206 | |
| Hollowbody Guitar | [Meshcaster Semi-Acoustic Guitar](https://sketchfab.com/3d-models/meshcaster-semi-acoustic-guitar-2d4e22c16e824fe18fed2a32a6f18f54) | Fredrik Johansen | |
| Keys | [Black_paino](https://sketchfab.com/3d-models/black-paino-3d64ece48827490e8fd4321f9050d8f0) | meshplalette66 | |
| Vocal | [microphone](https://sketchfab.com/3d-models/microphone-545b82406abf465cb0fd91a4be42ac05) | ssmilerok | New metal-roughness materials, since three.js no longer reads the original ones. |
| Studio door | [Commercial Doors](https://sketchfab.com/3d-models/commercial-doors-4d45cd37b2eb4577a96f82515b8ef684) | Delly | Kept one of the three doors. Split the hardware into a steel material and repainted the rest as oak. The frame is drawn in code. |

### Texture

- Studio floor: [High Quality Tileable Light Wood Texture 1](https://www.flickr.com/photos/webtreatsetc/4727355663/)
  by webtreats, licensed [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
  Cut into chevron parquet planks in code, recolored, and evened out.

### Impulse responses

The room reverbs use recorded impulse responses, in `public/reverbs/`.

- Brick club and Concert hall: `cement-blocks.wav` and `scala-milan-opera-hall.wav` from
  [Voxengo](https://www.voxengo.com/)'s free impulse response pack, copyright Aleksey
  Vaneev. Included unaltered apart from their file names, with the license terms in
  `public/reverbs/voxengo-license.txt`.
- Studio: Sound Room A by Cian Riordan, copyright 2021. The left and right recordings
  were joined into one stereo file, trimmed and faded out. The license terms are in
  `public/reverbs/sound-room-a-license.txt`.
