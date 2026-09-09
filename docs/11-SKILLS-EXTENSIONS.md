# 11 — Skills & Extensions

Installed AI design skills live in `.opencode/skills/` (opencode skill format;
each folder has `SKILL.md` + references/scripts/data).

## Installed skills

| Skill | Purpose |
|---|---|
| `ui-ux-pro-max` | Design intelligence: 79 UI styles, 192 palettes, 74 font pairings, 192 industry rules, design-system generator (`search.py`) |
| `ui-styling` | Tailwind/shadcn component & theming references, config generator |
| `design-system` | Token architecture + slide/token tooling |
| `design` | Logo/CIP/banner/slides generators (sub-scripts) |
| `brand` | Brand guideline templates + asset tooling |
| `slides` | Presentation layout patterns |
| `banner-design` | Banner sizes/styles reference |

## Using ui-ux-pro-max

Design system generation (stdin-free, offline, Python stdlib only):

```powershell
python .opencode\skills\ui-ux-pro-max\scripts\search.py "event rentals party celebration" --design-system --persist -p "Jan Jimels Party Needs"
python .opencode\skills\ui-ux-pro-max\scripts\search.py "glassmorphism" --domain style
python .opencode\skills\ui-ux-pro-max\scripts\search.py "form validation" --stack react
```

The persisted master (with the owner's **Brand Override** — navy/gold, Playfair/Poppins)
lives at `design-system/jan-jimels-party-needs/MASTER.md` and is the source of truth
for UI decisions (see docs/07-DESIGN-SYSTEM.md). If the skill is ever re-run, the
generated purple/orange palette must remain overridden.

## Conventions when using skills

- Run skill scripts read-only against the repo; they never hit the network.
- Apply the design system's pre-delivery checklist (icons, contrast, focus,
  reduced-motion) on every UI change.
- Skills are versioned in git (`.opencode/`), so other machines/AIs get them
  automatically — do not add `node_modules`-style artifacts.
