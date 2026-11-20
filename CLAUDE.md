# CLAUDE.md: Rafeeq (رفيق لينكدإن)

Free, open-source, Arabic-first helpers for LinkedIn members. Owner: Ashraf Al Tarawneh (Riyadh). Reply to him in Arabic unless he writes in English.

## Non-negotiable principle

Rafeeq works **beside** LinkedIn, never inside it. LinkedIn's help page "Prohibited software and extensions" and User Agreement §8.2 ban software and extensions that scrape, modify the appearance of, or automate activity on LinkedIn, and LinkedIn scans browsers for known extensions.

- No scraping, no DOM reading, no automation, no requests to linkedin.com.
- Input is text the user pastes, or the user's own official data export ("Get a copy of your data").
- The user copies and posts by hand. Auto-posting is allowed only through approved official LinkedIn APIs, and only in a later phase.
- Processing stays local: no servers, no tracking. On-premises and self-hosting friendly.

## Layout

- `app/index.html`: a single-file local web app with five tools (scam checker, privacy checker with image redaction, post checker, Arabic RTL carousel to PDF, `Connections.csv` network analyzer). Pure logic sits between `/*CORE-START*/` and `/*CORE-END*/` so tests can load it.
  - Optional Claude features through `window.claude.use('sample')` (AI rewrite, second opinion) and `use('downloads')`. Both are hidden when absent; standalone runs fall back to `<a download>`.
  - The PDF writer is hand-written (`jpegPdf`, JPEG pages, no library).
- `skills/*/SKILL.md`: seven Claude plugin skills: job-scam-check, privacy-check, linkedin-post-studio, profile-optimizer, job-match, linkedin-messages, network-insights.
- `.claude-plugin/plugin.json` and `marketplace.json`: the repo is its own plugin marketplace (`/plugin marketplace add <owner>/rafeeq`, then `/plugin install rafeeq@rafeeq`).
- `.github/workflows/pages.yml`: runs the tests, then deploys `app/` to GitHub Pages.

## Commands

- Tests: `node tests/core.test.mjs` (Node 22+).
- Plugin check: `claude plugin validate .`
- Preview: open `app/index.html` in a browser.

## Conventions

- Keep `SCAM_RULES` in the app and the weight table in `skills/job-scam-check/SKILL.md` in sync.
- Every new rule needs a positive test and a false-positive test.
- Normalize Arabic-Indic digits (`normDigits`) before matching.
- Arabic copy: clear Modern Standard Arabic, short sentences, and official names of Saudi bodies (DGA, NDMO, SDAIA).
- License: MIT. Code stays dependency-free unless a library does real work.

## Status (v0.1.0, 2026-11-21)

Done: the five web tools, the seven skills, tests passing, plugin validation passing, PDF export verified in headless Chrome. A preview is published as a private Claude artifact.

## Open items

1. Verify the Saudi fraud-reporting channels named in `skills/job-scam-check/SKILL.md` (Absher, Kollona Amn) before the public launch.
2. Create a GitHub repo, push, and enable Pages.
3. Next tools from the roadmap (`docs/ROADMAP.md`).
