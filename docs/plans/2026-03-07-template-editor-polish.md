# Template Editor Polish

Align TemplateEditor and TemplateProposal with the site's design language.

## Changes

### Card wrapper
Wrap the template editor (table + CGS note) in the standard card: `rounded-lg border border-border-subtle bg-bg-raised p-4`.

### Table styling
- Use shared `TH` constant from `utils/styles.ts` for column headers.
- Body cell padding: `px-3 py-2` (was `px-2 py-1`).
- Body row borders: `border-border-subtle` (was `border-border-default/50`).
- Add row hover: `hover:bg-white/[0.03]`.
- Footer border stays `border-t border-border-default`.

### Spinner inputs
Replace raw `<input type="number">` with the minus/value/plus spinner pattern used in BuildStatEditor, TierPresets, and KbToggle. Edited state keeps amber highlight on value cell with struck-through original to the left.

### Slot name capitalization
Map JSON keys to display names:
- `weapon` -> Weapon, `helmet` -> Helmet, `top` -> Overall, `earring` -> Earring
- `eye` -> Eye, `face` -> Face, `pendant` -> Pendant, `medal` -> Medal
- `ring1`-`ring4` -> Ring 1-Ring 4, `belt` -> Belt
- `cape` -> Cape, `shoe` -> Shoe, `glove` -> Glove, `shield` -> Shield
- "Overall" gets an info hover tooltip: "Top and bottom are combined into a single slot."

### Proposal section
Change `bg-bg-surface` to `bg-bg-raised` to match card pattern.
