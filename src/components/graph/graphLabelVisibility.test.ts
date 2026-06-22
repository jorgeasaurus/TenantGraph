import { describe, expect, it } from 'vitest';
import { boxesOverlap } from './graphLabelVisibility';

describe('graph label visibility', () => {
  it('detects overlapping label boxes for collision fading', () => {
    expect(
      boxesOverlap(
        { height: 20, width: 120, x: 40, y: 40 },
        { height: 20, width: 120, x: 100, y: 45 },
      ),
    ).toBe(true);

    expect(
      boxesOverlap(
        { height: 20, width: 120, x: 40, y: 40 },
        { height: 20, width: 120, x: 220, y: 90 },
      ),
    ).toBe(false);
  });
});
