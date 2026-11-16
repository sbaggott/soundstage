import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { AudioEngine } from '../audio/engine';
import type { Room as RoomPreset } from '../rooms';
import { STAGE, STEMS, type StagePosition, type StemId } from '../stems';
import { Instrument } from './Instrument';
import { LabelTracker, useLabelRegistry } from './labels';
import { Room, roomWidth } from './Room';

type Props = {
  engine: AudioEngine;
  positions: Record<StemId, StagePosition>;
  room: RoomPreset;
  onMove: (id: StemId, position: StagePosition) => void;
};

const LISTENER = 'listener';
const FOV = 42;
// Horizontal field of view at a typical laptop aspect ratio. Narrower screens widen the
// vertical field of view to keep this, so the whole stage fits on a phone.
const MIN_HORIZONTAL_FOV = 2 * Math.atan(Math.tan(((FOV / 2) * Math.PI) / 180) * 1.3);

function ResponsiveFov() {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.size.width / state.size.height);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const fitWidth = (2 * Math.atan(Math.tan(MIN_HORIZONTAL_FOV / 2) / aspect) * 180) / Math.PI;
    camera.fov = Math.min(100, Math.max(FOV, fitWidth));
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  return null;
}

const MAX_AZIMUTH = Math.PI / 3;
// How close the camera may get to a side wall, in meters.
const WALL_GAP = 0.5;

// Look around, but stay in the room and above the floor. The side-to-side limit tightens
// as the camera pulls back, so it never swings out past a side wall.
function CameraControls({ room, enabled }: { room: RoomPreset; enabled: boolean }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const halfWidth = roomWidth(room) / 2 - WALL_GAP;

  useFrame(({ camera }) => {
    const c = controls.current;
    if (!c) return;
    const offset = camera.position.clone().sub(c.target);
    const reach = Math.hypot(offset.x, offset.z);
    const azimuth = reach > halfWidth ? Math.min(MAX_AZIMUTH, Math.asin(halfWidth / reach)) : MAX_AZIMUTH;
    c.minAzimuthAngle = -azimuth;
    c.maxAzimuthAngle = azimuth;
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={enabled}
      enablePan={false}
      target={[0, 0, -1]}
      minDistance={5}
      maxDistance={16}
      maxPolarAngle={Math.PI / 2.2}
      minAzimuthAngle={-MAX_AZIMUTH}
      maxAzimuthAngle={MAX_AZIMUTH}
    />
  );
}

export function Stage({ engine, positions, room, onMove }: Props) {
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<StemId | null>(null);
  const labels = useLabelRegistry();

  useEffect(() => {
    const anchors = labels.current.anchors;
    anchors.set(LISTENER, { point: new Vector3(0, STAGE.earHeight, STAGE.listenerZ), lift: 0.55 });
    return () => {
      anchors.delete(LISTENER);
    };
  }, [labels]);

  const onActiveChange = useCallback((id: StemId, isActive: boolean) => {
    setActive((current) => (isActive ? id : current === id ? null : current));
  }, []);

  const labelRef = (id: string) => (el: HTMLElement | null) => {
    if (el) labels.current.elements.set(id, el);
    else labels.current.elements.delete(id);
  };

  return (
    <>
      <Canvas shadows="percentage" camera={{ position: [0, 7, 12], fov: FOV }} dpr={[1, 2]}>
        <color attach="background" args={['#120d0a']} />
        <ambientLight intensity={0.35} />
        <spotLight
          position={[0, 9, 3]}
          angle={0.7}
          penumbra={0.6}
          intensity={120}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Room key={room.id} room={room} />
        {STEMS.map((stem) => (
          <Instrument
            key={stem.id}
            stem={stem}
            position={positions[stem.id]}
            engine={engine}
            labels={labels}
            onDragChange={setDragging}
            onActiveChange={onActiveChange}
            onMove={(position) => onMove(stem.id, position)}
          />
        ))}
        <LabelTracker registry={labels} />
        <ResponsiveFov />

        <CameraControls room={room} enabled={!dragging} />
      </Canvas>

      <div className="labels" aria-hidden="true">
        {STEMS.map((stem) => (
          <span key={stem.id} ref={labelRef(stem.id)} className={`label${active === stem.id ? ' label--active' : ''}`}>
            {stem.label}
          </span>
        ))}
        <span ref={labelRef(LISTENER)} className="label label--listener">
          You
        </span>
      </div>
    </>
  );
}
