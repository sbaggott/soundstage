export type StemId =
  | 'drums'
  | 'bass'
  | 'keys'
  | 'guitar'
  | 'horns'
  | 'strings'
  | 'vox';

export type StagePosition = { x: number; z: number };

export type Stem = {
  id: StemId;
  label: string;
  url: string;
  color: string;
  home: StagePosition;
  // 3D models to show instead of the placeholder. More than one shares the spot (horns).
  models?: ModelPart[];
  // Radius of the level ring around the models, in meters.
  footprint?: number;
};

// One 3D model. `rotation` (radians, x/y/z) stands it the right way up and faces it at the
// listener; `size` is then its longest side in meters, so every file comes out true to
// life whatever units it was made in. `offset` moves it from the instrument's center.
export type ModelPart = {
  url: string;
  size: number;
  rotation?: [number, number, number];
  offset?: [number, number];
};

const base = `${import.meta.env.BASE_URL}audio/shoulda-never`;
const models = `${import.meta.env.BASE_URL}3d`;

// Stage coordinates in meters. x runs stage left (-) to stage right (+), z runs from the
// back wall (-) toward the audience (+). The listener sits in front of the stage.
export const STAGE = {
  minX: -5.5,
  maxX: 5.5,
  minZ: -5.5,
  maxZ: 0.5,
  listenerZ: 4,
  earHeight: 1.2,
};

export const STEMS: Stem[] = [
  {
    id: 'drums',
    label: 'Drums',
    url: `${base}/drums.mp3`,
    color: '#e8a33d',
    home: { x: 0, z: -4.5 },
    models: [{ url: `${models}/drum_kit.glb`, size: 2 }],
    footprint: 1.2,
  },
  {
    id: 'bass',
    label: 'Bass',
    url: `${base}/bass.mp3`,
    color: '#d9583b',
    home: { x: -2.2, z: -3.4 },
    models: [{ url: `${models}/electric_bass.glb`, size: 1.15, rotation: [Math.PI / 2, 0, 0] }],
    footprint: 0.5,
  },
  {
    id: 'keys',
    label: 'Keys',
    url: `${base}/keys.mp3`,
    color: '#5aa9e6',
    home: { x: 3.6, z: -4 },
    models: [{ url: `${models}/piano.glb`, size: 1.5, rotation: [0, -Math.PI / 2, 0] }],
    footprint: 0.95,
  },
  {
    id: 'guitar',
    label: 'Guitar',
    url: `${base}/guitar.mp3`,
    color: '#9bc53d',
    home: { x: -3.6, z: -1.4 },
    models: [{ url: `${models}/fender_stratocaster_guitar_blue.glb`, size: 1, rotation: [0, 0, Math.PI / 2] }],
    footprint: 0.5,
  },
  {
    id: 'horns',
    label: 'Horns',
    url: `${base}/horns.mp3`,
    color: '#f2c14e',
    home: { x: 3.8, z: -1 },
    models: [
      // Larger than life (sax 1.5x, trumpet 1.2x), so they read next to the drums.
      { url: `${models}/saxophone.glb`, size: 1.05, offset: [-0.3, 0] },
      { url: `${models}/trumpet.glb`, size: 0.6, offset: [0.4, 0] },
    ],
    footprint: 0.8,
  },
  {
    id: 'strings',
    label: 'Strings',
    url: `${base}/strings.mp3`,
    color: '#b48ead',
    home: { x: -4.6, z: -4.4 },
    // 1.5x life size, so it reads next to the drums.
    models: [{ url: `${models}/violin.glb`, size: 0.9, rotation: [Math.PI / 2, 0, 0] }],
    footprint: 0.45,
  },
  {
    id: 'vox',
    label: 'Vocal',
    url: `${base}/vox.mp3`,
    color: '#f4f1de',
    home: { x: 0, z: -0.6 },
    // A mic on a straight stand, turned so the grille faces the singer (upstage).
    models: [{ url: `${models}/microphone.glb`, size: 1.7, rotation: [0, Math.PI, 0] }],
    footprint: 0.4,
  },
];

export function clampToStage({ x, z }: StagePosition): StagePosition {
  return {
    x: Math.min(STAGE.maxX, Math.max(STAGE.minX, x)),
    z: Math.min(STAGE.maxZ, Math.max(STAGE.minZ, z)),
  };
}
