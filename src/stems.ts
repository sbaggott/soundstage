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
};

const base = `${import.meta.env.BASE_URL}audio/shoulda-never`;

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
  { id: 'drums', label: 'Drums', url: `${base}/drums.mp3`, color: '#e8a33d', home: { x: 0, z: -4.5 } },
  { id: 'bass', label: 'Bass', url: `${base}/bass.mp3`, color: '#d9583b', home: { x: -2.2, z: -3.4 } },
  { id: 'keys', label: 'Keys', url: `${base}/keys.mp3`, color: '#5aa9e6', home: { x: 3.6, z: -4 } },
  { id: 'guitar', label: 'Guitar', url: `${base}/guitar.mp3`, color: '#9bc53d', home: { x: -3.6, z: -1.4 } },
  { id: 'horns', label: 'Horns', url: `${base}/horns.mp3`, color: '#f2c14e', home: { x: 3.8, z: -1 } },
  { id: 'strings', label: 'Strings', url: `${base}/strings.mp3`, color: '#b48ead', home: { x: -4.6, z: -4.4 } },
  { id: 'vox', label: 'Vocal', url: `${base}/vox.mp3`, color: '#f4f1de', home: { x: 0, z: -0.6 } },
];

export function clampToStage({ x, z }: StagePosition): StagePosition {
  return {
    x: Math.min(STAGE.maxX, Math.max(STAGE.minX, x)),
    z: Math.min(STAGE.maxZ, Math.max(STAGE.minZ, z)),
  };
}
