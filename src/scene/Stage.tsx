import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { AudioEngine } from '../audio/engine';
import { STAGE, STEMS, type StagePosition, type StemId } from '../stems';
import { Instrument } from './Instrument';
import { LabelTracker, useLabelRegistry } from './labels';
import { Room } from './Room';

type Props = {
  engine: AudioEngine;
  positions: Record<StemId, StagePosition>;
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

export function Stage({ engine, positions, onMove }: Props) {
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
        <pointLight position={[-6, 4, -2]} intensity={12} color="#ffb070" />
        <pointLight position={[6, 4, -2]} intensity={12} color="#70a0ff" />

        <Room />
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

        {/* Look around, but stay in the room and above the floor. */}
        <OrbitControls
          enabled={!dragging}
          enablePan={false}
          target={[0, 0, -1]}
          minDistance={5}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
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
