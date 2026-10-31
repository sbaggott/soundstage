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

const MODELS = {
  drum_kit: { prepare: prepareDrums },
  electric_bass: {},
  fender_stratocaster_guitar_blue: {},
  piano: {},
  saxophone: {},
  trumpet: {},
  violin: {},
};

const io = new NodeIO();
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
