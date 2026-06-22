import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DetailsPanel } from './DetailsPanel';

describe('DetailsPanel', () => {
  it('renders a no-selection prompt when no object is selected', () => {
    const html = renderToStaticMarkup(
      <DetailsPanel
        busy={false}
        expansion={{ canExpand: false, label: 'No expansion' }}
        impactMetrics={[]}
        onExpand={() => undefined}
      />,
    );

    expect(html).toContain('Selection');
    expect(html).toContain('Select an object to explain it.');
  });
});
