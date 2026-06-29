import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Toolbar } from './Toolbar';

const noop = () => undefined;

describe('Toolbar account menu', () => {
  it('renders live tenant account links and sign-out action', () => {
    const html = renderToStaticMarkup(
      <Toolbar
        accountName="Adele Vance"
        depth={1}
        focusDepth={0}
        loading={false}
        searchTerm=""
        onDepthChange={noop}
        onFitGraph={noop}
        onFocusDepthChange={noop}
        onResetGraph={noop}
        onResetView={noop}
        onSearch={noop}
        onSearchTermChange={noop}
        onSignOut={noop}
      />,
    );

    expect(html).toContain('Open Profile');
    expect(html).toContain('Switch Tenant');
    expect(html).toContain('Sign Out');
    expect(html).not.toContain('Exit Sample');
  });

  it('hides live tenant account links in sample mode', () => {
    const html = renderToStaticMarkup(
      <Toolbar
        accountName="Sample tenant / Lumon"
        depth={1}
        focusDepth={0}
        isSampleTenant
        loading={false}
        searchTerm=""
        onDepthChange={noop}
        onFitGraph={noop}
        onFocusDepthChange={noop}
        onResetGraph={noop}
        onResetView={noop}
        onSearch={noop}
        onSearchTermChange={noop}
        onSignOut={noop}
      />,
    );

    expect(html).not.toContain('Open Profile');
    expect(html).not.toContain('Switch Tenant');
    expect(html).toContain('Exit Sample');
  });
});
