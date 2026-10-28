import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Group, Mesh, MeshStandardMaterial, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { AudioEngine } from '../audio/engine';
import { clampToStage, type StagePosition, type Stem } from '../stems';
import type { LabelRegistry } from './labels';

type Props = {
  stem: Stem;
  position: StagePosition;
  engine: AudioEngine;
  onDragChange: (dragging: boolean) => void;
  onMove: (position: StagePosition) => void;
  onActiveChange: (id: Stem['id'], active: boolean) => void;
  labels: RefObject<LabelRegistry>;
};

const FLOOR = new Plane(new Vector3(0, 1, 0), 0);

export function Instrument({ stem, position, engine, onDragChange, onMove, onActiveChange, labels }: Props) {
  const group = useRef<Group>(null);
  const body = useRef<MeshStandardMaterial>(null);
  const ring = useRef<Mesh>(null);
  const level = useRef(0);
  // Where on the instrument the pointer grabbed it, so it doesn't jump to the cursor.
  const grabOffset = useRef(new Vector3());
  const hit = useRef(new Vector3());
  const pointer = useRef(new Vector2());
  const raycaster = useRef(new Raycaster());
  const { camera, gl } = useThree();
  const live = useRef<StagePosition>(position);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const anchors = labels.current.anchors;
    if (group.current) anchors.set(stem.id, { object: group.current, lift: 1.15 });
    return () => {
      anchors.delete(stem.id);
    };
  }, [labels, stem.id]);

  const active = hovered || dragging;
  useEffect(() => onActiveChange(stem.id, active), [stem.id, active, onActiveChange]);

  useEffect(() => {
    if (!hovered && !dragging) return;
    document.body.style.cursor = dragging ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered, dragging]);

  // Level drives the glow every frame without going through React state.
  useFrame((_, delta) => {
    const target = Math.min(1, engine.getLevel(stem.id) * 6);
    const rate = target > level.current ? 30 : 6;
    level.current += (target - level.current) * Math.min(1, delta * rate);
    if (body.current) body.current.emissiveIntensity = 0.08 + level.current * 1.6;
    if (ring.current) ring.current.scale.setScalar(1 + level.current * 0.9);
  });

  // The drag listens on the window, not the mesh: once the instrument hits the edge of
  // the stage the pointer can leave it, and the release still has to end the drag.
  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    if (!group.current || e.button !== 0) return;
    e.stopPropagation();
    live.current = { x: group.current.position.x, z: group.current.position.z };
    if (e.ray.intersectPlane(FLOOR, hit.current)) {
      grabOffset.current.copy(group.current.position).sub(hit.current);
    }
    setDragging(true);
    onDragChange(true);

    const move = (event: PointerEvent) => {
      if (event.pointerId !== e.pointerId || !group.current) return;
      const rect = gl.domElement.getBoundingClientRect();
      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(pointer.current, camera);
      if (!raycaster.current.ray.intersectPlane(FLOOR, hit.current)) return;
      // Move the mesh and the audio directly; React only hears about it on release.
      const next = clampToStage({
        x: hit.current.x + grabOffset.current.x,
        z: hit.current.z + grabOffset.current.z,
      });
      group.current.position.set(next.x, 0, next.z);
      engine.setPosition(stem.id, next);
      live.current = next;
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== e.pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      setDragging(false);
      onDragChange(false);
      onMove(live.current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  return (
    <group ref={group} position={[position.x, 0, position.z]}>
      <mesh
        position={[0, 0.35, 0]}
        castShadow
        onPointerDown={onPointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.45, 0.5, 0.7, 40]} />
        <meshStandardMaterial
          ref={body}
          color={stem.color}
          emissive={stem.color}
          emissiveIntensity={0.08}
          roughness={0.45}
        />
      </mesh>

      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.58, 0.66, 48]} />
        <meshBasicMaterial color={stem.color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
