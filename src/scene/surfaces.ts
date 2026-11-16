import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { Surface } from '../rooms';

// Wall and floor textures drawn on a canvas. Each one tiles; `surfaceTexture` hands back
// a copy repeated to suit the mesh size. All but the parquet are drawn from scratch, so
// there are no image files to license.

const SIZE = 512;
// How many meters one tile covers.
const TILE_METERS: Record<Surface, number> = {
  wood: 2,
  // Four chevron rows per tile, each 1 m wide, so planks are about 1.4 m long.
  parquet: 4,
  brick: 2.5,
  plaster: 4,
  // Two 1.2 m (4 ft) sheets per tile.
  drywall: 2.4,
  foam: 1.2,
  concrete: 3,
  fabric: 1,
  // Painted over a model's own UVs (the door), so the tile is the whole object.
  oak: 1,
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
  // The parquet's stand-in until its photo loads.
  parquet: (ctx, rand) => painters.wood(ctx, rand),
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
  drywall(ctx, rand) {
    // Painted off-white with a fine roller texture, and taped seams that barely show.
    ctx.fillStyle = '#ebe5d9';
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (const x of [0, SIZE / 2]) {
      ctx.fillStyle = 'rgb(120 105 85 / 0.07)';
      ctx.fillRect(x, 0, 2, SIZE);
    }
    noise(ctx, rand, 0.035);
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
  oak(ctx, rand) {
    // Amber oak, toned to sit with the cloth panels: fine vertical grain that wanders a
    // little, and a few darker streaks.
    ctx.fillStyle = '#c08550';
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 90; i++) {
      const x = rand() * SIZE;
      const sway = 4 + rand() * 10;
      const dark = rand() < 0.15;
      ctx.strokeStyle = dark
        ? `rgb(105 58 24 / ${0.25 + rand() * 0.2})`
        : `rgb(135 82 38 / ${0.08 + rand() * 0.14})`;
      ctx.lineWidth = dark ? 1.5 + rand() * 2 : 0.6 + rand() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + sway, SIZE / 3, x - sway, (SIZE * 2) / 3, x, SIZE);
      ctx.stroke();
    }
    noise(ctx, rand, 0.04);
  },
  fabric(ctx, rand) {
    // A loose basket weave in muted tan, the cloth on studio absorption panels. Coarse
    // enough to read from across the room: each thread crosses about 3 cm.
    const cell = 16;
    ctx.fillStyle = '#5e4630';
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let y = 0; y < SIZE; y += cell) {
      for (let x = 0; x < SIZE; x += cell) {
        const across = ((x + y) / cell) % 2 === 0;
        const tone = 0.88 + rand() * 0.2;
        // A thread is lit along its middle and falls into shadow at the edges.
        const gradient = across
          ? ctx.createLinearGradient(0, y, 0, y + cell)
          : ctx.createLinearGradient(x, 0, x + cell, 0);
        gradient.addColorStop(0, shade([110, 82, 56], tone));
        gradient.addColorStop(0.5, shade([160, 124, 88], tone));
        gradient.addColorStop(1, shade([100, 74, 50], tone));
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
    noise(ctx, rand, 0.06);
  },
  concrete(ctx, rand) {
    ctx.fillStyle = '#4c4a47';
    ctx.fillRect(0, 0, SIZE, SIZE);
    noise(ctx, rand, 0.1);
  },
};

// Chevron parquet: planks at 45 degrees, mirrored in alternate rows so they meet in a V,
// each one cut from a photo of wood grain. Until the photo loads (or if it's missing,
// since it's local only) the floor shows the plain drawn planks instead.
const PARQUET_PHOTO = `${import.meta.env.BASE_URL}3d/wood.jpeg`;
const PARQUET_SIZE = 1024;

// The photo is lit unevenly, brighter in the middle. Cut into planks, that turns every
// plank light at one end and dark at the other, and the floor looks folded. Divide out
// the broad light and shade (a very blurred copy) and keep only the grain.
function evenOutLighting(canvas: HTMLCanvasElement) {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;
  const small = document.createElement('canvas');
  small.width = 8;
  small.height = 12;
  const s = small.getContext('2d')!;
  s.drawImage(canvas, 0, 0, small.width, small.height);
  const blurred = document.createElement('canvas');
  blurred.width = width;
  blurred.height = height;
  const b = blurred.getContext('2d')!;
  b.imageSmoothingQuality = 'high';
  b.drawImage(small, 0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const light = b.getImageData(0, 0, width, height).data;
  const mean = [0, 0, 0];
  for (let i = 0; i < light.length; i += 4) for (let c = 0; c < 3; c++) mean[c] += light[i + c];
  for (let c = 0; c < 3; c++) mean[c] /= light.length / 4;
  for (let i = 0; i < image.data.length; i += 4) {
    for (let c = 0; c < 3; c++) image.data[i + c] = (image.data[i + c] * mean[c]) / Math.max(1, light[i + c]);
  }
  ctx.putImageData(image, 0, 0);
}

function paintParquet(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, rand: () => number) {
  // Turn the photo so its grain runs sideways, along each plank.
  const grain = document.createElement('canvas');
  grain.width = photo.height;
  grain.height = photo.width;
  const g = grain.getContext('2d')!;
  g.translate(grain.width, 0);
  g.rotate(Math.PI / 2);
  g.drawImage(photo, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
  evenOutLighting(grain);

  const rows = 4;
  const rowWidth = PARQUET_SIZE / rows;
  // Planks advance this far down a row; 8 per tile so the pattern repeats cleanly.
  const step = PARQUET_SIZE / 8;
  const thickness = step / Math.SQRT2;
  // Long enough to reach both edges of the row at every corner; the clip trims the rest.
  const length = rowWidth * Math.SQRT2 + thickness * 2;
  const stripHeight = (grain.width * thickness) / length;

  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(0, 0, PARQUET_SIZE, PARQUET_SIZE);

  for (let row = 0; row < rows; row++) {
    const x = row * rowWidth;
    const angle = row % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
    for (let k = 0; k < 8; k++) {
      // Each plank gets its own piece of the photo and a slight change of tone.
      const sy = rand() * (grain.height - stripHeight);
      const tone = 1.8 + rand() * 0.15;
      // Drawn at three heights so planks crossing the top or bottom edge wrap.
      for (const wrap of [-PARQUET_SIZE, 0, PARQUET_SIZE]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, 0, rowWidth, PARQUET_SIZE);
        ctx.clip();
        ctx.translate(x + rowWidth / 2, k * step + wrap);
        ctx.rotate(angle);
        // Warmed toward amber, like a varnished floor.
        ctx.filter = `brightness(${tone}) contrast(0.75) sepia(0.55) saturate(1.7)`;
        ctx.drawImage(grain, 0, sy, grain.width, stripHeight, -length / 2, -thickness / 2, length, thickness);
        ctx.filter = 'none';
        ctx.strokeStyle = 'rgb(40 22 10 / 0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-length / 2, -thickness / 2, length, thickness);
        ctx.restore();
      }
    }
    // The seam down the middle of the V.
    ctx.fillStyle = 'rgb(40 22 10 / 0.3)';
    ctx.fillRect(x, 0, 1.5, PARQUET_SIZE);
  }
}

const cache = new Map<Surface, CanvasTexture>();
// Copies handed out per surface. Three.js re-uploads a texture only when that copy is
// flagged, so a canvas repainted later (the parquet) has to flag each one.
const copies = new Map<Surface, Set<Texture>>();

function baseTexture(surface: Surface) {
  let texture = cache.get(surface);
  if (!texture) {
    const parquet = surface === 'parquet';
    const canvas = document.createElement('canvas');
    canvas.width = parquet ? PARQUET_SIZE : SIZE;
    canvas.height = canvas.width;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(canvas.width / SIZE, canvas.width / SIZE);
    painters[surface](ctx, random(surface.length * 7919));
    ctx.restore();
    texture = new CanvasTexture(canvas);
    if (parquet) {
      const photo = new Image();
      photo.onload = () => {
        paintParquet(ctx, photo, random(4271));
        copies.get(surface)?.forEach((copy) => (copy.needsUpdate = true));
      };
      photo.src = PARQUET_PHOTO;
    }
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 4;
    cache.set(surface, texture);
  }
  return texture;
}

// The drawn tile itself, for painting into other textures.
export function surfaceCanvas(surface: Surface) {
  return baseTexture(surface).image as HTMLCanvasElement;
}

export function surfaceTexture(surface: Surface, widthMeters: number, heightMeters: number): Texture {
  const texture = baseTexture(surface).clone();
  const tile = TILE_METERS[surface];
  texture.repeat.set(widthMeters / tile, heightMeters / tile);
  texture.needsUpdate = true;
  if (!copies.has(surface)) copies.set(surface, new Set());
  copies.get(surface)!.add(texture);
  texture.addEventListener('dispose', () => copies.get(surface)?.delete(texture));
  return texture;
}
