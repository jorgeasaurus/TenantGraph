export type SampleAppIconKey =
  | 'kierKeeper'
  | 'macrodataRefiner'
  | 'wafflePlanner'
  | 'compunctionStudio'
  | 'perpetuityGuide'
  | 'defiantJazzDetector'
  | 'eggBarScheduler'
  | 'breakRoomRecorder'
  | 'wellnessMemoryViewer'
  | 'goatLedger'
  | 'overtimeConsole'
  | 'lumonHandbook'
  | 'eaganBingo'
  | 'coldHarborTracker'
  | 'opticsCatalog'
  | 'severedMail'
  | 'melonBarInventory'
  | 'securityDesk';

type GraphLargeIcon = {
  type: `image/${string}`;
  value: string;
};

type IconSpec = {
  accent: string;
  appName: string;
  background: string;
  glyph: string;
  sourceUrl: string;
};

const appSpecs = {
  kierKeeper: spec('Kier Keeper', 'KK', '#091521', '#2de2ff'),
  macrodataRefiner: spec('Macrodata Refiner', 'MR', '#111827', '#7cf7c6'),
  wafflePlanner: spec('Waffle Party Planner', 'WP', '#201622', '#ffcc66'),
  compunctionStudio: spec('Compunction Statement Studio', 'CS', '#171427', '#ff6bcb'),
  perpetuityGuide: spec('Perpetuity Wing Guide', 'PW', '#101a24', '#b8f7ff'),
  defiantJazzDetector: spec('Defiant Jazz Detector', 'DJ', '#0d192e', '#7aa7ff'),
  eggBarScheduler: spec('Egg Bar Scheduler', 'EB', '#1d1a12', '#ffd166'),
  breakRoomRecorder: spec('Break Room Recorder', 'BR', '#21131a', '#ff6f91'),
  wellnessMemoryViewer: spec('Wellness Memory Viewer', 'WV', '#102019', '#91f5ad'),
  goatLedger: spec('Goat Ledger', 'GL', '#132018', '#c4f06d'),
  overtimeConsole: spec('Overtime Contingency Console', 'OC', '#101628', '#00d4ff'),
  lumonHandbook: spec('Lumon Handbook', 'LH', '#142033', '#d7e3ff'),
  eaganBingo: spec('Eagan Bingo', 'EB', '#21172a', '#b58cff'),
  coldHarborTracker: spec('Cold Harbor Tracker', 'CH', '#0b1f2a', '#69e7ff'),
  opticsCatalog: spec('Optics Design Catalog', 'OD', '#101f1f', '#55efc4'),
  severedMail: spec('Severed Mail', 'SM', '#121827', '#8fd3ff'),
  melonBarInventory: spec('Melon Bar Inventory', 'MB', '#182013', '#b6ff7a'),
  securityDesk: spec('Security Desk Console', 'SD', '#1c1722', '#ff9fb2'),
} as const satisfies Record<SampleAppIconKey, IconSpec>;

export const sampleAppIconSources = Object.fromEntries(
  Object.entries(appSpecs).map(([key, value]) => [
    key,
    {
      appName: value.appName,
      artworkUrl: `generated://sample/lumon/${key}`,
      sourceUrl: value.sourceUrl,
    },
  ]),
) as Record<SampleAppIconKey, { appName: string; artworkUrl: string; sourceUrl: string }>;

export const sampleAppIcons = Object.fromEntries(
  Object.entries(appSpecs).map(([key, value]) => [
    key,
    icon(value),
  ]),
) as Record<SampleAppIconKey, GraphLargeIcon>;

function spec(appName: string, glyph: string, background: string, accent: string): IconSpec {
  return {
    accent,
    appName,
    background,
    glyph,
    sourceUrl: `https://lumon.example/apps/${slug(appName)}`,
  };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function icon({ accent, background, glyph }: IconSpec): GraphLargeIcon {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">',
    `<rect width="96" height="96" rx="22" fill="${background}"/>`,
    `<path d="M18 68V28h60v40H18Z" fill="none" stroke="${accent}" stroke-width="4" opacity=".78"/>`,
    `<path d="M30 34h36M30 48h36M30 62h36" stroke="${accent}" stroke-width="3" opacity=".35"/>`,
    `<circle cx="24" cy="28" r="6" fill="${accent}" opacity=".9"/>`,
    `<circle cx="72" cy="68" r="7" fill="${accent}" opacity=".3"/>`,
    `<text x="48" y="56" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="25" font-weight="800" fill="#f8fbff">${glyph}</text>`,
    '</svg>',
  ].join('');

  return { type: 'image/svg+xml', value: globalThis.btoa(svg) };
}
