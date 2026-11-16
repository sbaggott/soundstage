export type RoomId = 'studio' | 'club' | 'hall' | 'dead';

export type Surface =
  | 'wood'
  | 'parquet'
  | 'brick'
  | 'plaster'
  | 'drywall'
  | 'foam'
  | 'concrete'
  | 'fabric'
  | 'oak';

export type Reverb = {
  // Length of the reverb tail in seconds.
  seconds: number;
  // How fast the tail falls away. Higher is a deader room.
  decay: number;
  // Gap before the first reflections arrive. Bigger rooms have longer gaps.
  preDelay: number;
  // Lowpass on the reverb return. Soft surfaces swallow highs, so lower is warmer.
  // Leave it out for no lowpass at all.
  damping?: number;
  // Reverb send level for an instrument at the front of the stage.
  wet: number;
  // An impulse response recorded in a real room. When it loads, it replaces the synthetic
  // tail (seconds, decay and pre-delay); damping and wet still apply.
  recording?: string;
};

export type Look = {
  // Extra room around the stage, in meters, on each side and behind it.
  margin: number;
  height: number;
  walls: Surface;
  floor: Surface;
  // Tint of the two side lights.
  warm: string;
  cool: string;
};

export type Room = {
  id: RoomId;
  name: string;
  blurb: string;
  reverb: Reverb;
  look: Look;
};

const reverbs = `${import.meta.env.BASE_URL}reverbs`;

export const ROOMS: Room[] = [
  {
    id: 'studio',
    name: 'Studio',
    blurb: 'Wood floor, diffusers on the walls. Warm and controlled.',
    reverb: {
      seconds: 1.4,
      decay: 3.2,
      preDelay: 0.01,
      wet: 0.3,
      recording: `${reverbs}/sound-room-a.wav`,
    },
    look: { margin: 1.5, height: 5, walls: 'drywall', floor: 'parquet', warm: '#ffb070', cool: '#ffd7a0' },
  },
  {
    id: 'club',
    name: 'Brick club',
    blurb: 'Bare brick and concrete. Bright, quick reflections.',
    reverb: {
      seconds: 1.2,
      decay: 2.2,
      preDelay: 0.006,
      damping: 10000,
      wet: 0.4,
      recording: `${reverbs}/cement-blocks.wav`,
    },
    look: { margin: 1, height: 4.5, walls: 'brick', floor: 'concrete', warm: '#ff8a50', cool: '#7aa0ff' },
  },
  {
    id: 'hall',
    name: 'Concert hall',
    blurb: 'Tall and wide. A long, smooth tail.',
    reverb: {
      seconds: 3.2,
      decay: 2.6,
      preDelay: 0.035,
      damping: 5000,
      wet: 0.42,
      recording: `${reverbs}/scala-milan-opera-hall.wav`,
    },
    look: { margin: 6, height: 14, walls: 'plaster', floor: 'wood', warm: '#ffd9a8', cool: '#c8d8ff' },
  },
  {
    id: 'dead',
    name: 'Dead room',
    blurb: 'Foam on every wall. Almost dry.',
    reverb: { seconds: 0.4, decay: 5, preDelay: 0.002, damping: 3500, wet: 0.12 },
    look: { margin: 1, height: 4, walls: 'foam', floor: 'concrete', warm: '#9a8cff', cool: '#6cc6ff' },
  },
];

export const DEFAULT_ROOM = ROOMS[0];

export function getRoom(id: RoomId): Room {
  return ROOMS.find((room) => room.id === id) ?? DEFAULT_ROOM;
}
