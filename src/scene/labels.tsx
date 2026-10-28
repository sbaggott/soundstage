import { useFrame, useThree } from '@react-three/fiber';
import { useRef, type RefObject } from 'react';
import { Object3D, Vector3 } from 'three';

// Labels are plain DOM over the canvas. Each frame, every anchor's 3D position is
// projected to screen space and written straight to its label's transform, so moving the
// camera or dragging an instrument never re-renders React.

export type Anchor = { object?: Object3D; point?: Vector3; lift: number };

export type LabelRegistry = {
  anchors: Map<string, Anchor>;
  elements: Map<string, HTMLElement>;
};

export function useLabelRegistry(): RefObject<LabelRegistry> {
  return useRef<LabelRegistry>({ anchors: new Map(), elements: new Map() });
}

export function LabelTracker({ registry }: { registry: RefObject<LabelRegistry> }) {
  const { camera, size } = useThree();
  const world = useRef(new Vector3());

  useFrame(() => {
    const { anchors, elements } = registry.current;
    for (const [id, el] of elements) {
      const anchor = anchors.get(id);
      if (!anchor) continue;
      if (anchor.object) anchor.object.getWorldPosition(world.current);
      else if (anchor.point) world.current.copy(anchor.point);
      world.current.y += anchor.lift;
      world.current.project(camera);
      const hidden = world.current.z > 1;
      el.style.visibility = hidden ? 'hidden' : 'visible';
      if (hidden) continue;
      const x = ((world.current.x + 1) / 2) * size.width;
      const y = ((1 - world.current.y) / 2) * size.height;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
  });

  return null;
}
