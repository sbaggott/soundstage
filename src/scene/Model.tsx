import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Component, useEffect, useMemo, type ReactNode } from 'react';
import { Box3, Mesh, MeshStandardMaterial, PMREMGenerator, Vector3, type Texture, type WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ModelPart } from '../stems';

// Metal and polished finishes are lit by what they reflect, and the stage has nothing to
// reflect, so they render black. Give the instruments (not the room) a soft studio to
// reflect, generated in code so there's no image to download.
const environments = new WeakMap<WebGLRenderer, Texture>();

function studioReflections(gl: WebGLRenderer) {
  let texture = environments.get(gl);
  if (!texture) {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    texture = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    environments.set(gl, texture);
  }
  return texture;
}

type Props = {
  part: ModelPart;
  onMeasure?: (height: number) => void;
};

// A loaded instrument, turned upright, scaled to its real-world size, centered on its
// stage position and standing on the floor. Picking hits a simple box around it rather
// than every triangle.
export function Model({ part, onMeasure }: Props) {
  const { scene } = useGLTF(part.url, false);
  const gl = useThree((state) => state.gl);

  const { object, size, offset } = useMemo(() => {
    const [x, y, z] = part.rotation ?? [0, 0, 0];
    const offset = part.offset ?? [0, 0];
    const reflections = studioReflections(gl);
    const object = scene.clone(true);
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.raycast = () => {};
      for (const material of [child.material].flat()) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        material.envMap = reflections;
        material.envMapIntensity = 0.6;
      }
    });
    object.rotation.set(x, y, z);
    object.updateMatrixWorld(true);
    // Precise: measure the vertices. The quick version pads rotated parts, which leaves
    // the model floating above the floor.
    const box = new Box3().setFromObject(object, true);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = part.size / Math.max(size.x, size.y, size.z);
    object.scale.setScalar(scale);
    object.position.set(offset[0] - center.x * scale, -box.min.y * scale, offset[1] - center.z * scale);
    return { object, size: size.multiplyScalar(scale), offset };
  }, [scene, part, gl]);

  useEffect(() => onMeasure?.(size.y), [size, onMeasure]);

  return (
    <group>
      <primitive object={object} />
      <mesh position={[offset[0], size.y / 2, offset[1]]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Models are local only until each license is sorted, so a fresh clone won't have them.
// If one fails to load, show the fallback instead of taking down the stage.
export class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
