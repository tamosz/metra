import { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard.js';
import { GearPage } from './components/GearPage.js';
import { FormulasPage } from './components/FormulasPage.js';
import { PartyBuilder } from './components/PartyBuilder.js';
import { useSimulation } from './hooks/useSimulation.js';
import { getProposalFromUrl, getPartyFromUrl } from './utils/url-encoding.js';
import { getFilterFromUrl } from './utils/filter-url.js';
import { SimulationFiltersProvider, useSimulationFilters } from './context/SimulationFiltersContext.js';
import { ProposalEditProvider, useProposalEdit } from './context/ProposalEditContext.js';
import { useFilterPermalink } from './hooks/useFilterPermalink.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import type { SkillGroupId } from './utils/skill-groups.js';

type Page = 'dashboard' | 'gear' | 'formulas' | 'party';

export function App() {
  return (
    <SimulationFiltersProvider>
      <ProposalEditProvider>
        <AppContent />
      </ProposalEditProvider>
    </SimulationFiltersProvider>
  );
}

function AppContent() {
  const filters = useSimulationFilters();
  const edit = useProposalEdit();
  const simulation = useSimulation({
    targetCount: filters.targetCount > 1 ? filters.targetCount : undefined,
    elementModifiers: Object.keys(filters.elementModifiers).length > 0 ? filters.elementModifiers : undefined,
    buffOverrides: Object.keys(filters.buffOverrides).length > 0 ? filters.buffOverrides : undefined,
    kbConfig: filters.kbConfig,
    efficiencyOverrides: Object.keys(filters.efficiencyOverrides).length > 0 ? filters.efficiencyOverrides : undefined,
  });
  const [page, setPage] = useState<Page>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
  };

  // Load from URL hash on mount
  const loadedFromUrl = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loadedFromUrl.current) return;
    loadedFromUrl.current = true;

    const urlParty = getPartyFromUrl();
    if (urlParty) {
      setPage('party');
      return;
    }
    const urlProposal = getProposalFromUrl();
    if (urlProposal) {
      edit.loadEditState(
        urlProposal.changes,
        urlProposal.name ? { name: urlProposal.name, author: urlProposal.author || '' } : undefined,
      );
      setPage('dashboard');
      return;
    }
    const urlFilter = getFilterFromUrl();
    if (urlFilter) {
      if (urlFilter.buffs) filters.setBuffOverrides(urlFilter.buffs);
      if (urlFilter.elements) filters.setElementModifiers(urlFilter.elements);
      if (urlFilter.kb) {
        filters.setKbEnabled(true);
        if (urlFilter.kb.interval !== undefined) filters.setBossAttackInterval(urlFilter.kb.interval);
        if (urlFilter.kb.accuracy !== undefined) filters.setBossAccuracy(urlFilter.kb.accuracy);
      }
      if (urlFilter.targets !== undefined) filters.setTargetCount(urlFilter.targets);
      if (urlFilter.cap !== undefined) filters.setCapEnabled(urlFilter.cap);
      if (urlFilter.groups) filters.setActiveGroups(new Set(urlFilter.groups as SkillGroupId[]));
      if (urlFilter.breakdown !== undefined) filters.setBreakdownEnabled(urlFilter.breakdown);
      setPage('dashboard');
    }
  }, []);

  useFilterPermalink(filters);

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <header className="relative border-b border-border-default px-4 py-4 sm:px-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              filters.resetFilters();
              edit.resetEdit();
              window.history.replaceState(null, '', window.location.pathname);
              navigate('dashboard');
            }}
            className="flex cursor-pointer items-baseline gap-3 border-none bg-transparent p-0"
          >
            <h1
              className="m-0 text-lg text-text-bright"
              style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.08em' }}
            >
              metra
            </h1>
            <span className="text-[10px] font-medium tracking-[0.2em] text-text-dim">
              royals dps
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden gap-1 md:flex">
            <NavButton active={page === 'dashboard'} onClick={() => navigate('dashboard')}>
              rankings
            </NavButton>
            <NavButton active={page === 'gear'} onClick={() => navigate('gear')}>
              gear
            </NavButton>
            <NavButton active={page === 'formulas'} onClick={() => navigate('formulas')}>
              formulas
            </NavButton>
            <NavButton active={page === 'party'} onClick={() => navigate('party')}>
              party
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
              rankings
            </NavButton>
            <NavButton active={page === 'gear'} onClick={() => navigate('gear')}>
              gear
            </NavButton>
            <NavButton active={page === 'formulas'} onClick={() => navigate('formulas')}>
              formulas
            </NavButton>
            <NavButton active={page === 'party'} onClick={() => navigate('party')}>
              party
            </NavButton>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8">
        {page === 'dashboard' && (
          <ErrorBoundary>
            <Dashboard simulation={simulation} />
          </ErrorBoundary>
        )}
        {page === 'gear' && (
          <ErrorBoundary>
            <GearPage />
          </ErrorBoundary>
        )}
        {page === 'formulas' && <ErrorBoundary><FormulasPage /></ErrorBoundary>}
        {page === 'party' && <ErrorBoundary><PartyBuilder /></ErrorBoundary>}
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
