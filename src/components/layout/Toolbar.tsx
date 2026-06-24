import { Building2, HelpCircle, LogOut, Maximize2, RefreshCw, RotateCcw, Search, UserCircle } from 'lucide-react';

type ToolbarProps = {
  accountName: string;
  depth: number;
  focusDepth: number;
  isSampleTenant?: boolean;
  loading: boolean;
  searchTerm: string;
  onDepthChange: (depth: number) => void;
  onFitGraph: () => void;
  onFocusDepthChange: (depth: number) => void;
  onOpenGuide?: () => void;
  onResetGraph: () => void;
  onResetView: () => void;
  onSearch: () => void;
  onSearchTermChange: (value: string) => void;
  onSignOut: () => void;
};

export function Toolbar({
  accountName,
  depth,
  focusDepth,
  isSampleTenant = false,
  loading,
  searchTerm,
  onDepthChange,
  onFitGraph,
  onFocusDepthChange,
  onOpenGuide,
  onResetGraph,
  onResetView,
  onSearch,
  onSearchTermChange,
  onSignOut,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <div className="brand-glyph" aria-hidden="true" />
        <div>
          <strong>Tenant Graph</strong>
          <span>{accountName}</span>
        </div>
      </div>

      <section className="graph-control-group" aria-label="Graph controls">
        <form
          className="toolbar-search"
          data-guide="toolbar-search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <Search size={16} />
          <input
            aria-label="Search tenant objects"
            placeholder="Search Intune objects"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
          />
        </form>

        <label className="toolbar-control compact">
          Focus
          <select
            aria-label="Focus depth"
            value={focusDepth}
            onChange={(event) => onFocusDepthChange(Number(event.target.value))}
          >
            <option value={0}>Off</option>
            <option value={1}>Direct</option>
            <option value={2}>Two-Hop</option>
          </select>
        </label>

        <label className="toolbar-control compact">
          Depth
          <select
            aria-label="Relationship depth"
            value={depth}
            onChange={(event) => onDepthChange(Number(event.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>

        <button type="button" title="Reset to signed-in user" onClick={onResetGraph} disabled={loading}>
          <RefreshCw size={16} />
          Reset
        </button>
        <button type="button" title="Reset view" onClick={onResetView}>
          <RotateCcw size={16} />
          View
        </button>
        <button type="button" title="Fit graph" onClick={onFitGraph}>
          <Maximize2 size={16} />
          Fit
        </button>
        {onOpenGuide && (
          <button data-guide="guide-button" type="button" title="Open sample tenant guide" onClick={onOpenGuide}>
            <HelpCircle size={16} />
            Guide
          </button>
        )}
      </section>

      <details className="account-menu">
        <summary aria-label="Account menu" title={accountName}>
          <UserCircle size={18} />
          <span>{initials(accountName)}</span>
        </summary>
        <div className="account-menu-popover">
          <strong>{accountName}</strong>
          {!isSampleTenant && (
            <>
              <button type="button" onClick={() => openAccountUrl('https://myaccount.microsoft.com/')}>
                <UserCircle size={15} />
                Profile
              </button>
              <button type="button" onClick={() => openAccountUrl('https://myaccount.microsoft.com/organizations')}>
                <Building2 size={15} />
                Tenant switch
              </button>
            </>
          )}
          <button type="button" onClick={onSignOut}>
            <LogOut size={15} />
            {isSampleTenant ? 'Exit sample' : 'Sign out'}
          </button>
        </div>
      </details>
    </header>
  );
}

function initials(name: string): string {
  const parts = name.split(/[.@\s_-]+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'T'}${parts[1]?.[0] ?? 'G'}`.toUpperCase();
}

function openAccountUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
