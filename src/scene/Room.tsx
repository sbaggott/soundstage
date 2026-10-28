import { STAGE } from '../stems';

const WIDTH = STAGE.maxX - STAGE.minX + 3;
const BACK = STAGE.minZ - 1.5;
const FRONT = STAGE.listenerZ + 3;
const DEPTH = FRONT - BACK;
const HEIGHT = 5;

export function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (BACK + FRONT) / 2]} receiveShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial color="#3a2a1e" roughness={0.85} />
      </mesh>

      {/* Stage area: where instruments can go */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[(STAGE.minX + STAGE.maxX) / 2, 0.005, (STAGE.minZ + STAGE.maxZ) / 2]}
        receiveShadow
      >
        <planeGeometry args={[STAGE.maxX - STAGE.minX + 1, STAGE.maxZ - STAGE.minZ + 1]} />
        <meshStandardMaterial color="#5b4330" roughness={0.7} />
      </mesh>

      {/* Back and side walls */}
      <mesh position={[0, HEIGHT / 2, BACK]} receiveShadow>
        <boxGeometry args={[WIDTH, HEIGHT, 0.2]} />
        <meshStandardMaterial color="#7a3b2e" roughness={0.95} />
      </mesh>
      <mesh position={[-WIDTH / 2, HEIGHT / 2, (BACK + FRONT) / 2]} receiveShadow>
        <boxGeometry args={[0.2, HEIGHT, DEPTH]} />
        <meshStandardMaterial color="#6b3428" roughness={0.95} />
      </mesh>
      <mesh position={[WIDTH / 2, HEIGHT / 2, (BACK + FRONT) / 2]} receiveShadow>
        <boxGeometry args={[0.2, HEIGHT, DEPTH]} />
        <meshStandardMaterial color="#6b3428" roughness={0.95} />
      </mesh>

      <Listener />
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
