import { useRef } from 'react';

type Credit = { use: string; title: string; author: string; url?: string; authorUrl?: string; license?: string };

const CC_BY_4 = 'CC BY 4.0';

// Keep in step with the credits in README.md.
const SECTIONS: { heading: string; credits: Credit[] }[] = [
  {
    heading: 'Music',
    credits: [
      { use: 'Song', title: 'She’s Seated At The Table', author: 'Sage Baggott', authorUrl: 'https://sagebaggott.com' },
    ],
  },
  {
    heading: '3D models',
    credits: [
      { use: 'Drums', title: 'Drum Kit', author: 'art.katja', url: 'https://sketchfab.com/3d-models/drum-kit-898f2f4ba1704abe9c784066e2b0f751', license: CC_BY_4 },
      { use: 'Bass', title: 'Electric bass', author: 'Nixak', url: 'https://sketchfab.com/3d-models/electric-bass-c5927d3f189c4e2595078020ba84d305', license: CC_BY_4 },
      { use: 'Electric Guitar', title: 'Fender Stratocaster', author: 'YieldingMist206', url: 'https://sketchfab.com/3d-models/fender-stratocaster-guitar-blue-96a79610434f43b2ac2a09a636afc5d4', license: CC_BY_4 },
      { use: 'Hollowbody Guitar', title: 'Meshcaster Semi-Acoustic Guitar', author: 'Fredrik Johansen', url: 'https://sketchfab.com/3d-models/meshcaster-semi-acoustic-guitar-2d4e22c16e824fe18fed2a32a6f18f54', license: CC_BY_4 },
      { use: 'Keys', title: 'Piano', author: 'meshplalette66', url: 'https://sketchfab.com/3d-models/black-paino-3d64ece48827490e8fd4321f9050d8f0', license: CC_BY_4 },
      { use: 'Vocal', title: 'Microphone', author: 'ssmilerok', url: 'https://sketchfab.com/3d-models/microphone-545b82406abf465cb0fd91a4be42ac05', license: CC_BY_4 },
      { use: 'Studio door', title: 'Commercial Doors', author: 'Delly', url: 'https://sketchfab.com/3d-models/commercial-doors-4d45cd37b2eb4577a96f82515b8ef684', license: CC_BY_4 },
    ],
  },
  {
    heading: 'Texture',
    credits: [
      { use: 'Studio floor', title: 'High Quality Tileable Light Wood Texture 1', author: 'webtreats', url: 'https://www.flickr.com/photos/webtreatsetc/4727355663/', license: 'CC BY 2.0' },
    ],
  },
  {
    heading: 'Reverb',
    credits: [
      { use: 'Brick club, Concert hall', title: 'Free impulse response pack', author: 'Voxengo (Aleksey Vaneev)', url: 'https://www.voxengo.com/', license: 'Voxengo license' },
      { use: 'Studio', title: 'Sound Room A', author: 'Cian Riordan', license: 'BSD-style license' },
    ],
  },
];

const LICENSES: Record<string, string> = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'Voxengo license': `${import.meta.env.BASE_URL}reverbs/voxengo-license.txt`,
  'BSD-style license': `${import.meta.env.BASE_URL}reverbs/sound-room-a-license.txt`,
};

const external = { target: '_blank', rel: 'noreferrer' } as const;

// A "Credits" link that opens the list of models, textures and reverbs used.
export function Credits() {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="credits__open" onClick={() => dialog.current?.showModal()}>
        Credits
      </button>
      <dialog
        ref={dialog}
        className="credits"
        aria-labelledby="credits-title"
        // A click on the backdrop lands on the dialog itself, so it closes.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      >
        <div className="credits__body">
          <div className="credits__header">
            <h2 id="credits-title">Credits</h2>
            <button type="button" className="credits__close" onClick={() => dialog.current?.close()} aria-label="Close">
              ×
            </button>
          </div>
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              {section.heading === '3D models' && (
                <p className="credits__thanks">Thanks to everyone below for sharing their work.</p>
              )}
              <h3>{section.heading}</h3>
              <ul>
                {section.credits.map((credit) => (
                  <li key={credit.title}>
                    <span className="credits__use">{credit.use}</span>
                    <span>
                      {credit.url ? (
                        <a href={credit.url} {...external}>
                          {credit.title}
                        </a>
                      ) : (
                        credit.title
                      )}{' '}
                      by{' '}
                      {credit.authorUrl ? (
                        <a href={credit.authorUrl} {...external}>
                          {credit.author}
                        </a>
                      ) : (
                        credit.author
                      )}
                      {credit.license && (
                        <>
                          ,{' '}
                          <a href={LICENSES[credit.license]} {...external}>
                            {credit.license}
                          </a>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </dialog>
    </>
  );
}
