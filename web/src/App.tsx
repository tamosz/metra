import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard.js';
import { ProposalBuilder } from './components/ProposalBuilder.js';
import { ProposalResults } from './components/ProposalResults.js';
import { BuildExplorer } from './components/BuildExplorer.js';
import { useSimulation } from './hooks/useSimulation.js';
import { useProposal } from './hooks/useProposal.js';
import { useBuildExplorer } from './hooks/useBuildExplorer.js';
import { getProposalFromUrl, getBuildFromUrl } from './utils/url-encoding.js';

type Page = 'dashboard' | 'proposal' | 'build';

export function App() {
  const simulation = useSimulation();
  const proposalState = useProposal();
  const buildState = useBuildExplorer();
  const [page, setPage] = useState<Page>('dashboard');

  // Load from URL hash on mount
  useEffect(() => {
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
      <header className="flex items-center gap-6 border-b border-border-default px-8 py-4">
        <h1 className="m-0 text-lg font-bold tracking-tight text-text-bright">
          MapleRoyals Balance Simulator
        </h1>
        <nav className="flex gap-1">
          <NavButton active={page === 'dashboard'} onClick={() => setPage('dashboard')}>
            Rankings
          </NavButton>
          <NavButton active={page === 'proposal'} onClick={() => setPage('proposal')}>
            Proposal Builder
          </NavButton>
          <NavButton active={page === 'build'} onClick={() => setPage('build')}>
            Build Explorer
          </NavButton>
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-8 py-6">
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
      className={`rounded-md border-none px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
        active
          ? 'bg-bg-active text-text-bright'
          : 'bg-transparent text-text-muted hover:text-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}
