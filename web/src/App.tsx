import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard.js';
import { ProposalBuilder } from './components/ProposalBuilder.js';
import { ProposalResults } from './components/ProposalResults.js';
import { BuildExplorer } from './components/BuildExplorer.js';
import { BuildComparison } from './components/BuildComparison.js';
import { useSimulation } from './hooks/useSimulation.js';
import { useProposal } from './hooks/useProposal.js';
import { useBuildExplorer } from './hooks/useBuildExplorer.js';
import { useBuildComparison } from './hooks/useBuildComparison.js';
import { getProposalFromUrl, getBuildFromUrl, getComparisonFromUrl } from './utils/url-encoding.js';

type Page = 'dashboard' | 'proposal' | 'build' | 'compare';

export function App() {
  const simulation = useSimulation();
  const proposalState = useProposal();
  const buildState = useBuildExplorer();
  const comparisonState = useBuildComparison();
  const [page, setPage] = useState<Page>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
  };

  // Load from URL hash on mount
  useEffect(() => {
    const urlComparison = getComparisonFromUrl();
    if (urlComparison) {
      comparisonState.loadFromUrl(urlComparison.a, urlComparison.b);
      setPage('compare');
      return;
    }
    const urlBuild = getBuildFromUrl();
    if (urlBuild) {
      buildState.loadFromUrl(urlBuild.class, urlBuild.tier, urlBuild.overrides);
      setPage('build');
      return;
    }
    const urlProposal = getProposalFromUrl();
    if (urlProposal) {
      proposalState.loadProposal(urlProposal);
      proposalState.simulate(urlProposal);
      setPage('proposal');
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <header className="relative border-b border-border-default px-4 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <h1 className="m-0 text-lg font-bold tracking-tight text-text-bright">
            MapleRoyals Balance Simulator
          </h1>

          {/* Desktop nav */}
          <nav className="hidden gap-1 md:flex">
            <NavButton active={page === 'dashboard'} onClick={() => navigate('dashboard')}>
              Rankings
            </NavButton>
            <NavButton active={page === 'proposal'} onClick={() => navigate('proposal')}>
              Proposal Builder
            </NavButton>
            <NavButton active={page === 'build'} onClick={() => navigate('build')}>
              Build Explorer
            </NavButton>
            <NavButton active={page === 'compare'} onClick={() => navigate('compare')}>
              Compare
            </NavButton>
          </nav>

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-auto cursor-pointer border-none bg-transparent p-1 text-text-muted md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <nav className="mt-3 flex flex-col gap-1 md:hidden">
            <NavButton active={page === 'dashboard'} onClick={() => navigate('dashboard')}>
              Rankings
            </NavButton>
            <NavButton active={page === 'proposal'} onClick={() => navigate('proposal')}>
              Proposal Builder
            </NavButton>
            <NavButton active={page === 'build'} onClick={() => navigate('build')}>
              Build Explorer
            </NavButton>
            <NavButton active={page === 'compare'} onClick={() => navigate('compare')}>
              Compare
            </NavButton>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8">
        {page === 'dashboard' && <Dashboard simulation={simulation} />}
        {page === 'proposal' && (
          <>
            <ProposalBuilder proposalState={proposalState} simulation={simulation} />
            {proposalState.result && (
              <ProposalResults
                result={proposalState.result}
                proposal={proposalState.proposal}
              />
            )}
          </>
        )}
        {page === 'build' && <BuildExplorer state={buildState} />}
        {page === 'compare' && <BuildComparison state={comparisonState} />}
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border-none px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer text-left ${
        active
          ? 'bg-bg-active text-text-bright'
          : 'bg-transparent text-text-muted hover:text-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}
