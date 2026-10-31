// Rebuilds the instrument models in public/3d from the untouched downloads in
// reference/models (<name>.original.glb). Both folders are local only, see .gitignore.
//
//   npm run models              rebuild every model
//   npm run models -- drum_kit  rebuild just one
//
// Each model gets an optional prepare step (remove parts, fix materials), then
// `gltf-transform optimize`: joins meshes, simplifies a little, meshopt-compresses the
// geometry and turns textures into 1024 px WebP.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsPBRSpecularGlossiness } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';

const SOURCE = 'reference/models';
const OUTPUT = 'public/3d';
const CLI = join('node_modules', '.bin', 'gltf-transform');

// The kit ships with a floor mat and a spare cymbal lying on it, and one flat grey
// "Metal" material shared by the stands and the cymbals. This has to happen before
// optimize, which joins meshes that share a material.
function prepareDrums(document) {
  const root = document.getRoot();

  for (const node of root.listNodes()) {
    if (['Plane.001__0', 'Circle.009', 'Circle.009_Metal_0'].includes(node.getName())) node.dispose();
  }

  // Stands, hoops and lugs: polished chrome.
  root
    .listMaterials()
    .find((material) => material.getName() === 'Metal')
    .setBaseColorFactor([0.95, 0.95, 0.96, 1])
    .setMetallicFactor(1)
    .setRoughnessFactor(0.08);

  // Crash, ride and hi-hats: bronze.
  const bronze = document
    .createMaterial('Cymbal')
    .setBaseColorFactor([0.6, 0.32, 0.1, 1])
    .setMetallicFactor(1)
    .setRoughnessFactor(0.34)
    .setDoubleSided(true);
  for (const name of ['Circle.003_Metal_0', 'Circle.005_Metal_0', 'Circle.006_Metal_0', 'Circle.007_Metal_0']) {
    const node = root.listNodes().find((candidate) => candidate.getName() === name);
    for (const primitive of node.getMesh().listPrimitives()) primitive.setMaterial(bronze);
  }
}

// The mic uses the old specular-glossiness materials, which three.js no longer reads: it
// would render every part as white chrome. Swap in plain metal-roughness finishes.
function prepareMicrophone(document) {
  const finishes = {
    Material: { color: [0.02, 0.02, 0.02, 1], metallic: 0, roughness: 0.5 }, // stand and body, black paint
    metal: { color: [0.25, 0.25, 0.26, 1], metallic: 1, roughness: 0.4 }, // clamps, gunmetal
    microphone_grid: { color: [0.8, 0.8, 0.82, 1], metallic: 1, roughness: 0.3 }, // grille, satin silver
    metal_2: { color: [0.9, 0.9, 0.92, 1], metallic: 1, roughness: 0.15 }, // gear, chrome
    black_resine: { color: [0.02, 0.02, 0.03, 1], metallic: 0, roughness: 0.6 }, // cable
    hole__0: { color: [0.01, 0.01, 0.01, 1], metallic: 0, roughness: 0.9 },
  };
  for (const material of document.getRoot().listMaterials()) {
    const finish = finishes[material.getName()];
    if (!finish) continue;
    material
      .setBaseColorFactor(finish.color)
      .setMetallicFactor(finish.metallic)
      .setRoughnessFactor(finish.roughness);
  }
  document.createExtension(KHRMaterialsPBRSpecularGlossiness).dispose();
}

const MODELS = {
  drum_kit: { prepare: prepareDrums },
  electric_bass: {},
  fender_stratocaster_guitar_blue: {},
  microphone: { prepare: prepareMicrophone },
  piano: {},
  saxophone: {},
  trumpet: {},
  violin: {},
};

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const scratch = mkdtempSync(join(tmpdir(), 'soundstage-models-'));
const names = process.argv.slice(2);

try {
  for (const name of names.length ? names : Object.keys(MODELS)) {
    const model = MODELS[name];
    if (!model) throw new Error(`Unknown model "${name}". Known: ${Object.keys(MODELS).join(', ')}`);

    let input = join(SOURCE, `${name}.original.glb`);
    if (model.prepare) {
      const document = await io.read(input);
      model.prepare(document);
      await document.transform(prune());
      input = join(scratch, `${name}.glb`);
      await io.write(input, document);
    }

    const output = join(OUTPUT, `${name}.glb`);
    execFileSync(CLI, [
      'optimize', input, output,
      '--compress', 'meshopt',
      '--texture-compress', 'webp',
      '--texture-size', '1024',
      '--simplify-error', '0.001',
    ]);
    console.log(`${name}: ${output}`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
