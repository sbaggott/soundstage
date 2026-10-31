import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  // Spoken value for screen readers, e.g. "50% wet".
  valueText: string;
  // Double-click returns here.
  defaultValue: number;
};

// Turns through 270 degrees, from bottom left (0) to bottom right (1).
const SWEEP = 270;
const START = 135;
// Pixels of vertical drag for the full range.
const TRAVEL = 160;
const RADIUS = 17;
const CENTER = 22;

function point(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)];
}

function arc(from: number, to: number) {
  const [x1, y1] = point(from, RADIUS);
  const [x2, y2] = point(to, RADIUS);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2} ${y2}`;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// A rotary knob: drag up or down, or use the arrow keys.
export function Knob({ value, onChange, label, valueText, defaultValue }: Props) {
  const drag = useRef<{ y: number; value: number } | null>(null);
  const angle = START + value * SWEEP;
  const [tipX, tipY] = point(angle, RADIUS - 6);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    drag.current = { y: e.clientY, value };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    onChange(clamp(drag.current.value + (drag.current.y - e.clientY) / TRAVEL));
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowUp: 0.05,
      ArrowRight: 0.05,
      ArrowDown: -0.05,
      ArrowLeft: -0.05,
      PageUp: 0.2,
      PageDown: -0.2,
    };
    if (e.key === 'Home') onChange(0);
    else if (e.key === 'End') onChange(1);
    else if (e.key in steps) onChange(clamp(value + steps[e.key]));
    else return;
    e.preventDefault();
  }

  return (
    <div
      className="knob"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={valueText}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onChange(defaultValue)}
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path className="knob__track" d={arc(START, START + SWEEP)} />
        {value > 0.005 && <path className="knob__value" d={arc(START, angle)} />}
        <circle className="knob__cap" cx={CENTER} cy={CENTER} r={RADIUS - 4} />
        <line className="knob__pointer" x1={CENTER} y1={CENTER} x2={tipX} y2={tipY} />
      </svg>
    </div>
  );
}
