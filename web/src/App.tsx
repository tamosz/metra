import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard.js';
import { ProposalBuilder } from './components/ProposalBuilder.js';
import { ProposalResults } from './components/ProposalResults.js';
import { useSimulation } from './hooks/useSimulation.js';
import { useProposal } from './hooks/useProposal.js';
import { getProposalFromUrl } from './utils/url-encoding.js';

type Page = 'dashboard' | 'proposal';

export function App() {
  const simulation = useSimulation();
  const proposalState = useProposal();
  const [page, setPage] = useState<Page>('dashboard');

  // Load proposal from URL hash on mount
  useEffect(() => {
    const urlProposal = getProposalFromUrl();
    if (urlProposal) {
      proposalState.loadProposal(urlProposal);
      proposalState.simulate();
      setPage('proposal');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e8' }}>
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: '#f0f0f8',
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
        background: active ? '#1e1e2e' : 'transparent',
        color: active ? '#f0f0f8' : '#888',
        border: 'none',
        padding: '6px 14px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = '#c0c0c8';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = '#888';
      }}
    >
      {children}
    </button>
  );
}
