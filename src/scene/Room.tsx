import { useEffect, useMemo } from 'react';
import type { Room as RoomPreset } from '../rooms';
import { STAGE } from '../stems';
import { surfaceTexture } from './surfaces';

const STAGE_WIDTH = STAGE.maxX - STAGE.minX;
const FRONT = STAGE.listenerZ + 3;

export function Room({ room }: { room: RoomPreset }) {
  const { margin, height, walls, floor } = room.look;
  const width = STAGE_WIDTH + margin * 2 + 1;
  const back = STAGE.minZ - margin;
  const depth = FRONT - back;
  const midZ = (back + FRONT) / 2;

  const textures = useMemo(
    () => ({
      floor: surfaceTexture(floor, width, depth),
      back: surfaceTexture(walls, width, height),
      side: surfaceTexture(walls, depth, height),
    }),
    [floor, walls, width, depth, height],
  );
  useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={textures.floor} roughness={0.85} />
      </mesh>

      {/* Stage area: where instruments can go */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, (STAGE.minZ + STAGE.maxZ) / 2]} receiveShadow>
        <planeGeometry args={[STAGE_WIDTH + 1, STAGE.maxZ - STAGE.minZ + 1]} />
        <meshStandardMaterial color="#000" transparent opacity={0.22} />
      </mesh>

      <mesh position={[0, height / 2, back]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={textures.back} roughness={0.95} />
      </mesh>
      <mesh position={[-width / 2, height / 2, midZ]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial map={textures.side} roughness={0.95} />
      </mesh>
      <mesh position={[width / 2, height / 2, midZ]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial map={textures.side} roughness={0.95} />
      </mesh>

      {room.id === 'studio' && <Diffusers back={back} />}
      {room.id === 'hall' && <Columns width={width} back={back} height={height} />}

      <pointLight position={[-width / 2 + 1, height * 0.7, -2]} intensity={14} color={room.look.warm} />
      <pointLight position={[width / 2 - 1, height * 0.7, -2]} intensity={14} color={room.look.cool} />

      <Listener />
    </group>
  );
}

// Quadratic residue diffusers, the real thing studios hang: well depths follow n² mod 7.
const QRD = Array.from({ length: 7 }, (_, n) => (n * n) % 7);

function Diffusers({ back }: { back: number }) {
  const wellWidth = 0.18;
  const panelWidth = wellWidth * QRD.length;
  const panels = [-3.2, -1.1, 1.1, 3.2];
  return (
    <group>
      {panels.map((x) =>
        QRD.map((d, i) => (
          <mesh
            key={`${x}-${i}`}
            position={[x - panelWidth / 2 + wellWidth * (i + 0.5), 2.6, back + 0.04 + (d * 0.05) / 2]}
            castShadow
          >
            <boxGeometry args={[wellWidth * 0.92, 1.8, 0.08 + d * 0.05]} />
            <meshStandardMaterial color="#b08055" roughness={0.6} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Columns({ width, back, height }: { width: number; back: number; height: number }) {
  const zs: number[] = [];
  for (let z = back + 2; z < FRONT; z += 4) zs.push(z);
  return (
    <group>
      {[-1, 1].flatMap((side) =>
        zs.map((z) => (
          <mesh key={`${side}-${z}`} position={[side * (width / 2 - 0.6), height / 2, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.5, height, 24]} />
            <meshStandardMaterial color="#e6dccb" roughness={0.7} />
          </mesh>
        )),
      )}
    </group>
  );
}

// Where the mix is heard from: front of house, facing the stage.
function Listener() {
  return (
    <group position={[0, 0, STAGE.listenerZ]}>
      <mesh position={[0, STAGE.earHeight, 0]} castShadow>
        <sphereGeometry args={[0.25, 32, 16]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.4} />
      </mesh>
      <mesh position={[0, STAGE.earHeight / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, STAGE.earHeight, 12]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}
