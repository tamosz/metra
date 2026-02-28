import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard.js';
import { ProposalBuilder } from './components/ProposalBuilder.js';
import { ProposalResults } from './components/ProposalResults.js';
import { BuildExplorer } from './components/BuildExplorer.js';
import { useSimulation } from './hooks/useSimulation.js';
import { useProposal } from './hooks/useProposal.js';
import { useBuildExplorer } from './hooks/useBuildExplorer.js';
import { getProposalFromUrl, getBuildFromUrl } from './utils/url-encoding.js';
import { colors } from './theme.js';

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
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text }}>
      <header style={{
        padding: '16px 32px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: colors.textBright,
          letterSpacing: '-0.02em',
        }}>
          MapleRoyals Balance Simulator
        </h1>
        <nav style={{ display: 'flex', gap: 4 }}>
          <NavButton
            active={page === 'dashboard'}
            onClick={() => setPage('dashboard')}
          >
            Rankings
          </NavButton>
          <NavButton
            active={page === 'proposal'}
            onClick={() => setPage('proposal')}
          >
            Proposal Builder
          </NavButton>
          <NavButton
            active={page === 'build'}
            onClick={() => setPage('build')}
          >
            Build Explorer
          </NavButton>
        </nav>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
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
      style={{
        background: active ? colors.bgActive : 'transparent',
        color: active ? colors.textBright : colors.textMuted,
        border: 'none',
        padding: '6px 14px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = '#c0c0c8'; // hover
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = colors.textMuted;
      }}
    >
      {children}
    </button>
  );
}
