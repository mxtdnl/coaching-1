# Coaching 1

Workshop materials and interactive tools for Coaching 1. Static HTML files with inline CSS and JavaScript — no build step, no dependencies.

## Files

- `index.html` — Landing page with a card linking to every `.html` file in the repository
- `coaching-1-workshop-1.html` — Workshop 1: Goals. Exploring how we set goals and what can often go wrong
- `2026-09-lagging-and-leading-indicators.html` — Workshop 2 slide deck on lagging and leading indicators (duplicated from `mxtdnl/slides`, `standalone/`)
- `signal-tower.html` — Signal Tower: a 10–15 minute single-player simulation on leading, lagging, vanity and guardrail indicators. Seeded and deterministic, in-browser test suite at `?test=1`. Design notes and calibration record in `signal-tower.md`
- `signal-tower.md` — Model changes from the design spec, calibration record and instructor notes for Signal Tower
- `tests/signal-tower.mjs` — Node test harness for `signal-tower.html` (built-ins only): `node tests/signal-tower.mjs`, or `--full` for 200 seeds per policy

## Adding files (mandatory)

Every `.html` file added to this repository must also be linked from `index.html`, in the same commit:

1. Add an `<a class="activity-card">` inside the `.activity-grid` div, with `href` set to the file's relative path.
2. Give the card `style="border-left: 6px solid var(--char-N)"` and its `.card-eyebrow` the matching `style="color: var(--char-N)"`. Do not use the same colour as the adjacent card.
3. Fill in `.card-eyebrow` (workshop number and type, e.g. `Workshop 3 &middot; Slides`), `.card-title` and a one-sentence `.card-desc`.
4. List the file in the Files section above.

When a file is renamed or removed, update or remove its card and its Files entry. Before committing, check that every `.html` file other than `index.html` has a card, and that every card's `href` points to a file that exists:

```sh
for f in *.html; do [ "$f" = index.html ] || grep -q "href=\"$f\"" index.html || echo "missing card: $f"; done
grep -o 'href="[^"]*\.html"' index.html | cut -d'"' -f2 | while read f; do [ -f "$f" ] || echo "dead link: $f"; done
```

## Testing

After changing `signal-tower.html`, run `node tests/signal-tower.mjs` (or open `signal-tower.html?test=1`). All tests must pass.

## Conventions

- All HTML files declare `<meta charset="utf-8">` before any content
- JavaScript strings use straight quotes, never Unicode smart/curly quotes
- No external dependencies — everything is inline, and files must work opened from the file system and from GitHub Pages
- UK English spelling throughout
- `index.html` follows the Bauhaus style of the `mxtdnl/third-places` landing page: cream background (`--bg: #F2DFBE`), zero border-radius, uppercase card titles, and the eight `--char-N` accent colours defined on `:root`. Signal Tower keeps its own palette, recorded in `signal-tower.md`
