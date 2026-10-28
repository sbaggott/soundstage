import { useEffect, useState } from 'react';
import type { AudioEngine } from '../audio/engine';

type Props = {
  engine: AudioEngine;
  onReset: () => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Transport({ engine, onReset }: Props) {
  const [playing, setPlaying] = useState(engine.isPlaying);
  const [time, setTime] = useState(engine.position);

  // Only this bar re-renders as the song plays, a few times a second.
  useEffect(() => {
    const id = window.setInterval(() => setTime(engine.position), 200);
    const off = engine.onEnded(() => {
      setPlaying(false);
      setTime(engine.duration);
    });
    return () => {
      window.clearInterval(id);
      off();
    };
  }, [engine]);

  async function toggle() {
    if (engine.isPlaying) {
      engine.pause();
      setPlaying(false);
    } else {
      await engine.play();
      setPlaying(true);
    }
  }

  return (
    <div className="transport">
      <button type="button" className="transport__play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
        )}
      </button>
      <span className="transport__time">{formatTime(time)}</span>
      <input
        type="range"
        className="transport__seek"
        min={0}
        max={engine.duration}
        step={0.1}
        value={time}
        aria-label="Seek"
        onChange={(e) => {
          const t = Number(e.target.value);
          engine.seek(t);
          setTime(t);
        }}
      />
      <span className="transport__time">{formatTime(engine.duration)}</span>
      <button type="button" className="transport__reset" onClick={onReset}>
        Reset stage
      </button>
    </div>
  );
}
