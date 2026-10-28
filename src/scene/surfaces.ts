import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { Surface } from '../rooms';

// Wall and floor textures drawn on a canvas, so there are no image files to license.
// Each one tiles; `surfaceTexture` hands back a copy repeated to suit the mesh size.

const SIZE = 512;
// How many meters one tile covers.
const TILE_METERS: Record<Surface, number> = {
  wood: 2,
  brick: 2.5,
  plaster: 4,
  foam: 1.2,
  concrete: 3,
};

// Seeded so the textures look the same on every load.
function random(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function shade(base: [number, number, number], amount: number) {
  const [r, g, b] = base.map((c) => Math.max(0, Math.min(255, Math.round(c * amount))));
  return `rgb(${r} ${g} ${b})`;
}

function noise(ctx: CanvasRenderingContext2D, rand: () => number, alpha: number) {
  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (rand() - 0.5) * 255 * alpha;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
}

const painters: Record<Surface, (ctx: CanvasRenderingContext2D, rand: () => number) => void> = {
  wood(ctx, rand) {
    const planks = 8;
    const w = SIZE / planks;
    for (let p = 0; p < planks; p++) {
      ctx.fillStyle = shade([120, 78, 48], 0.85 + rand() * 0.3);
      ctx.fillRect(p * w, 0, w, SIZE);
      // Grain
      for (let g = 0; g < 14; g++) {
        ctx.strokeStyle = `rgb(60 35 20 / ${0.08 + rand() * 0.12})`;
        ctx.lineWidth = 1 + rand() * 2;
        const x = p * w + rand() * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + rand() * 8 - 4, SIZE / 3, x + rand() * 8 - 4, (SIZE * 2) / 3, x, SIZE);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgb(30 18 10 / 0.6)';
      ctx.fillRect(p * w, 0, 2, SIZE);
    }
  },
  brick(ctx, rand) {
    ctx.fillStyle = '#6f6a62';
    ctx.fillRect(0, 0, SIZE, SIZE);
    const rows = 16;
    const h = SIZE / rows;
    const w = SIZE / 4;
    const mortar = 5;
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 ? w / 2 : 0;
      for (let c = -1; c < 5; c++) {
        ctx.fillStyle = shade([150, 62, 44], 0.7 + rand() * 0.45);
        ctx.fillRect(c * w + offset + mortar / 2, r * h + mortar / 2, w - mortar, h - mortar);
      }
    }
    noise(ctx, rand, 0.12);
  },
  plaster(ctx, rand) {
    ctx.fillStyle = '#d9cdb8';
    ctx.fillRect(0, 0, SIZE, SIZE);
    noise(ctx, rand, 0.06);
  },
  foam(ctx) {
    // Egg-crate wedges: each cell is four triangles lit from the top left.
    const cells = 8;
    const s = SIZE / cells;
    const faces = ['#3d3a4a', '#26232f', '#1b1922', '#2f2c3a'];
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const x0 = x * s;
        const y0 = y * s;
        const cx = x0 + s / 2;
        const cy = y0 + s / 2;
        const corners: [number, number][] = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s]];
        // Alternate wedge direction so it reads as foam, not a grid of pyramids.
        const flip = (x + y) % 2 === 1;
        for (let f = 0; f < 4; f++) {
          ctx.fillStyle = faces[(f + (flip ? 1 : 0)) % 4];
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(...corners[f]);
          ctx.lineTo(...corners[(f + 1) % 4]);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  },
  concrete(ctx, rand) {
    ctx.fillStyle = '#4c4a47';
    ctx.fillRect(0, 0, SIZE, SIZE);
    noise(ctx, rand, 0.1);
  },
};

const cache = new Map<Surface, CanvasTexture>();

function baseTexture(surface: Surface) {
  let texture = cache.get(surface);
  if (!texture) {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    painters[surface](ctx, random(surface.length * 7919));
    texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 4;
    cache.set(surface, texture);
  }
  return texture;
}

export function surfaceTexture(surface: Surface, widthMeters: number, heightMeters: number): Texture {
  const texture = baseTexture(surface).clone();
  const tile = TILE_METERS[surface];
  texture.repeat.set(widthMeters / tile, heightMeters / tile);
  texture.needsUpdate = true;
  return texture;
}
