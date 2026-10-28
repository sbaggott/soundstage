import { useEffect, useState } from 'react';
import { AudioEngine } from './audio/engine';
import { Stage } from './scene/Stage';
import { STEMS, type StagePosition, type StemId } from './stems';
import { Transport } from './ui/Transport';

type Positions = Record<StemId, StagePosition>;

const homePositions: () => Positions = () =>
  Object.fromEntries(STEMS.map((stem) => [stem.id, stem.home])) as Positions;

export function App() {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Positions>(homePositions);

  useEffect(() => {
    let cancelled = false;
    let created: AudioEngine | null = null;
    AudioEngine.load(STEMS, (n) => !cancelled && setLoaded(n))
      .then((e) => {
        created = e;
        if (cancelled) {
          e.dispose();
          return;
        }
        setEngine(e);
        // Handy for poking at the audio graph from the console during development.
        if (import.meta.env.DEV) Object.assign(window, { engine: e });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, []);

  function move(id: StemId, position: StagePosition) {
    setPositions((prev) => ({ ...prev, [id]: position }));
  }

  function reset() {
    const home = homePositions();
    for (const stem of STEMS) engine?.setPosition(stem.id, home[stem.id]);
    setPositions(home);
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Soundstage</h1>
        <p>“Shoulda Never” · drag the instruments around the stage and listen to the mix change</p>
      </header>

      {engine ? (
        <>
          <div className="app__stage">
            <Stage engine={engine} positions={positions} onMove={move} />
          </div>
          <Transport engine={engine} onReset={reset} />
          <p className="app__hint">Headphones recommended. Drag the room to look around.</p>
        </>
      ) : (
        <div className="app__loading" role="status">
          {error ? (
            <p>Something went wrong loading the song: {error}</p>
          ) : (
            <>
              <p>Loading stems {loaded} of {STEMS.length}</p>
              <progress max={STEMS.length} value={loaded} />
            </>
          )}
        </div>
      )}
    </main>
  );
}
