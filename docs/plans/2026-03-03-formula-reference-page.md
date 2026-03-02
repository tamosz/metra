# Formula Reference Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a static reference page to the web app documenting the full DPS calculation pipeline with KaTeX-rendered math.

**Architecture:** New `'formulas'` route in App.tsx. Single `FormulasPage.tsx` component with a sticky TOC sidebar. Content sections walk through the pipeline: stats → attack → damage range → crit → speed → cap → DPS → class reference table. Dynamic data tables (weapons, class config) pulled from the data bundle.

**Tech Stack:** react-katex + katex (KaTeX math rendering), existing Tailwind v4 styling, data from `@data` bundle.

---

### Task 1: Install KaTeX dependency

**Files:**
- Modify: `web/package.json`

**Step 1: Install react-katex and katex**

```bash
cd web && npm install katex react-katex
```

Also install the types:

```bash
cd web && npm install -D @types/katex
```

Note: `react-katex` may not have types. If not, we'll add a declaration file.

**Step 2: Verify installation**

```bash
cd web && npm ls katex react-katex
```

Expected: Both packages listed.

**Step 3: Add KaTeX CSS import**

Add to `web/index.html` in the `<head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />
```

Or import from node_modules in `web/src/index.css`:

```css
@import "katex/dist/katex.min.css";
```

Prefer the CSS import approach (bundled, no CDN dependency).

**Step 4: Add KaTeX dark theme overrides**

Add to `web/src/index.css` in the `@layer base` block:

```css
.katex { color: var(--color-text-bright); }
```

**Step 5: Commit**

```bash
git add web/package.json web/package-lock.json web/src/index.css
git commit -m "add katex dependency for formula page"
```

---

### Task 2: Add route and nav item

**Files:**
- Modify: `web/src/App.tsx`

**Step 1: Add 'formulas' to Page type**

In `web/src/App.tsx:17`, change:

```typescript
type Page = 'dashboard' | 'proposal' | 'build' | 'compare';
```

to:

```typescript
type Page = 'dashboard' | 'proposal' | 'build' | 'compare' | 'formulas';
```

**Step 2: Add import for FormulasPage**

Add after the BuildComparison import:

```typescript
import { FormulasPage } from './components/FormulasPage.js';
```

**Step 3: Add nav buttons (desktop and mobile)**

In the desktop nav (line ~78), add after the Compare NavButton:

```tsx
<NavButton active={page === 'formulas'} onClick={() => navigate('formulas')}>
  Formulas
</NavButton>
```

Same in the mobile dropdown nav (line ~118).

**Step 4: Add page render**

After the compare page render block (line ~167), add:

```tsx
{page === 'formulas' && <FormulasPage />}
```

**Step 5: Create stub FormulasPage**

Create `web/src/components/FormulasPage.tsx`:

```tsx
export function FormulasPage() {
  return (
    <div>
      <h2 className="text-lg font-bold text-text-bright mb-6">Damage Formulas</h2>
      <p className="text-text-secondary">Coming soon.</p>
    </div>
  );
}
```

**Step 6: Verify it compiles and renders**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

**Step 7: Commit**

```bash
git add web/src/App.tsx web/src/components/FormulasPage.tsx
git commit -m "add formulas page route and nav item"
```

---

### Task 3: Build the page layout with TOC sidebar

**Files:**
- Modify: `web/src/components/FormulasPage.tsx`

**Step 1: Implement the two-column layout**

Replace the stub with the full layout structure. The page has:
- A sticky TOC sidebar on the left (hidden on mobile, shown on `lg:` breakpoint)
- A horizontal pill strip on mobile (visible below `lg:`)
- Main content area on the right

Section IDs for anchor linking: `stats`, `attack`, `damage-range`, `crit`, `speed`, `damage-cap`, `dps`, `class-reference`.

```tsx
import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'stats', label: 'Stat Calculation' },
  { id: 'attack', label: 'Attack Calculation' },
  { id: 'damage-range', label: 'Damage Range' },
  { id: 'crit', label: 'Critical Damage' },
  { id: 'speed', label: 'Attack Speed' },
  { id: 'damage-cap', label: 'Damage Cap' },
  { id: 'dps', label: 'DPS Formula' },
  { id: 'class-reference', label: 'Class Reference' },
] as const;

export function FormulasPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex gap-10">
      {/* Desktop TOC sidebar */}
      <nav className="hidden lg:block sticky top-8 self-start w-48 shrink-0">
        <ul className="space-y-1 text-sm">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block rounded px-2.5 py-1.5 transition-colors no-underline ${
                  activeSection === id
                    ? 'bg-bg-active text-text-bright'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-text-bright mb-2">Damage Formulas</h2>
        <p className="text-text-secondary mb-8">
          The exact formulas used by the simulator, from raw stats to final DPS.
        </p>

        {/* Mobile TOC */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 mb-6 lg:hidden">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`shrink-0 rounded-full px-3 py-1 text-xs no-underline transition-colors ${
                activeSection === id
                  ? 'bg-bg-active text-text-bright'
                  : 'bg-bg-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Content sections — placeholder for now */}
        {SECTIONS.map(({ id, label }) => (
          <section key={id} id={id} className="mb-16 scroll-mt-8">
            <h3 className="text-base font-semibold text-text-bright mb-4 pb-2 border-b border-border-default">
              {label}
            </h3>
            <p className="text-text-muted text-sm">Content coming in next tasks.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add web/src/components/FormulasPage.tsx
git commit -m "add formula page layout with TOC sidebar"
```

---

### Task 4: Write content sections 1-3 (Stats, Attack, Damage Range)

**Files:**
- Modify: `web/src/components/FormulasPage.tsx`

This is the core content task. Replace the placeholder sections with real content using KaTeX.

**Step 1: Add KaTeX imports and type declaration**

If `react-katex` lacks types, create `web/src/react-katex.d.ts`:

```typescript
declare module 'react-katex' {
  import { FC } from 'react';
  interface KaTeXProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
  }
  export const InlineMath: FC<KaTeXProps>;
  export const BlockMath: FC<KaTeXProps>;
}
```

Add to FormulasPage.tsx:

```tsx
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
```

**Step 2: Write the Stat Calculation section**

Content covers:
- MW application: `\text{MW'd Base} = \lfloor \text{baseStat} \times \text{mwMultiplier} \rfloor`
- Total primary: `\text{totalPrimary} = \text{gearPrimary} + \text{MW'd Base}`
- Total secondary: same pattern, noting array support for Shadower

**Step 3: Write the Attack Calculation section**

Content covers:
- Physical echo: `\text{echo} = \lfloor (\text{WATK} + \text{potion} + \text{projectile}) \times 0.04 \rfloor`
- Mage echo: `\text{echo} = \lfloor (\text{INT} + \text{MATK} + \text{potion}) \times 0.04 \rfloor`
- Total attack: `\text{totalAttack} = \text{WATK} + \text{potion} + \text{projectile} + \text{echo}`
- Weapon multiplier table (imported from `@data/weapons.json`)

**Step 4: Write the Damage Range section**

The centerpiece. Three formula variants, each as a KaTeX BlockMath:

**Standard:**
```
\text{Max} = \lfloor \frac{(\text{primaryStat} \times W + \text{secondaryStat}) \times \text{totalAttack}}{100} \rfloor
```
```
\text{Min} = \lfloor \frac{(\text{primaryStat} \times W \times 0.9 \times M + \text{secondaryStat}) \times \text{totalAttack}}{100} \rfloor
```

**Throwing Star:**
```
\text{Max} = \lfloor \frac{5.0 \times \text{LUK} \times \text{totalAttack}}{100} \rfloor
```
```
\text{Min} = \lfloor \frac{2.5 \times \text{LUK} \times \text{totalAttack}}{100} \rfloor
```

**Magic:**
```
\text{Max} = \lfloor \left(\frac{\text{TMA}^2/1000 + \text{TMA}}{30} + \frac{\text{INT}}{200}\right) \times S_{\text{amp}} \times W_{\text{amp}} \rfloor
```
```
\text{Min} = \lfloor \left(\frac{\text{TMA}^2/1000 + \text{TMA} \times M \times 0.9}{30} + \frac{\text{INT}}{200}\right) \times S_{\text{amp}} \times W_{\text{amp}} \rfloor
```

Where TMA = INT + MATK + potion + mageEcho.

Each formula variant gets a brief note on which classes use it.

**Step 5: Verify it compiles**

```bash
cd web && npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add web/src/components/FormulasPage.tsx web/src/react-katex.d.ts
git commit -m "add stat, attack, and damage range formula sections"
```

---

### Task 5: Write content sections 4-6 (Crit, Speed, Damage Cap)

**Files:**
- Modify: `web/src/components/FormulasPage.tsx`

**Step 1: Write the Critical Damage section**

Two formula variants:

**addBeforeMultiply** (most classes):
```
\text{critDmg\%} = (\text{basePower} + \text{totalCritBonus}) \times \text{multiplier}
```

**addAfterMultiply** (Paladin):
```
\text{critDmg\%} = \text{basePower} \times \text{multiplier} + \text{totalCritBonus}
```

Where `totalCritBonus = builtInCritBonus + seCritBonus`.

Crit rate: `totalCritRate = \min(\text{builtInRate} + \text{seRate}, 1.0)`

Note which classes have built-in crit (NL 50%, BM/MM 40%).

**Step 2: Write the Attack Speed section**

Speed resolution:
```
\text{effectiveSpeed} = \max(2,\ \text{baseSpeed} - \text{reduction})
```

Where reduction = 2 (booster only) or 4 (booster + SI).

Note fixed-speed skills: Hurricane (0.12s), Demolition (2.34s), mage skills (per-skill fixed times).

**Step 3: Write the Damage Cap section**

Cap = 199,999.

Range cap:
```
\text{rangeCap} = \frac{\text{damageCap}}{\text{skillMultiplier}}
```

Adjusted range for partially-capped distribution:
```
r = \frac{\text{cap} - \text{min}}{\text{max} - \text{min}}
```
```
\text{adjusted} = \frac{\text{cap} + \text{min}}{2} \times r + \text{cap} \times (1 - r)
```

Brief explanation: uniform distribution from min to max, proportion below cap uses average of that sub-range, proportion at cap uses cap value.

**Step 4: Verify it compiles**

```bash
cd web && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add web/src/components/FormulasPage.tsx
git commit -m "add crit, speed, and damage cap formula sections"
```

---

### Task 6: Write content sections 7-8 (DPS, Class Reference Table)

**Files:**
- Modify: `web/src/components/FormulasPage.tsx`

**Step 1: Write the DPS Formula section**

The final formula putting it all together:

```
\text{avgDmg} = (\text{skillMult} \times (1 - \text{critRate}) \times \text{adjRange}_{\text{normal}} + \text{critMult} \times \text{critRate} \times \text{adjRange}_{\text{crit}}) \times \text{hitCount}
```

Shadow Partner:
```
\text{avgDmg}_{\text{SP}} = \text{avgDmg} \times 1.5
```

Final DPS:
```
\text{DPS} = \frac{\text{avgDmg}}{\text{attackTime}}
```

Multi-target: `effectiveTargets = min(maxTargets, targetCount)`, applied as a multiplier.

Combo groups: brief note that skills in a combo group have their DPS summed.

**Step 2: Write the Class Reference Table**

Import class data from the data bundle:

```tsx
import { discoveredData } from '../data/bundle.js';
```

Build a table with columns:
- Class name
- Formula type (standard / throwingStar / magic)
- Mastery
- Primary stat
- Secondary stat
- Crit formula (addBeforeMultiply / addAfterMultiply)
- Built-in crit rate (if any)
- Notable mechanics (Shadow Partner, Berserk, Stance, spell/weapon amp)

Populate dynamically from `discoveredData.classDataMap`. Use the `ClassSkillData` fields. Format nicely — highlight non-default values (e.g., only show built-in crit where it exists).

Style the table to match existing tables in the app (use Dashboard ranking table as reference for Tailwind classes).

**Step 3: Verify it compiles**

```bash
cd web && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add web/src/components/FormulasPage.tsx
git commit -m "add DPS formula and class reference table sections"
```

---

### Task 7: Type-check and test

**Files:**
- No new files

**Step 1: Full type-check**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

**Step 2: Run web unit tests**

```bash
cd web && npm test
```

Expected: All existing tests pass.

**Step 3: Run engine tests**

```bash
npx vitest run
```

Expected: All existing tests pass.

**Step 4: Visual check**

```bash
cd web && npm run dev
```

Open in browser, navigate to Formulas page. Check:
- TOC sidebar is sticky and highlights on scroll
- KaTeX equations render correctly (white text, proper formatting)
- Weapon multiplier table has all weapon types
- Class reference table has all 13 classes
- Mobile layout: pill strip shows, sidebar hides
- No console errors

**Step 5: Commit if any fixes were needed**

```bash
git add -A && git commit -m "fix formula page issues from visual review"
```

---

### Task 8: Build verification

**Step 1: Production build**

```bash
cd web && npm run build
```

Expected: Build succeeds. Check that KaTeX CSS is bundled (no missing fonts/styles).

**Step 2: Preview production build**

```bash
cd web && npm run preview
```

Open in browser, verify formulas render correctly in the production build.

**Step 3: Final commit if needed**

If any build issues were fixed, commit them.
