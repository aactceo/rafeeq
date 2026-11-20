# CLAUDE.md: Rafeeq (رفيق لينكدإن)

Free, open-source, Arabic-first helpers for LinkedIn members. Owner: Ashraf Al Tarawneh (Riyadh). Reply to him in Arabic unless he writes in English.

## Non-negotiable principle

Rafeeq works **beside** LinkedIn, never inside it. LinkedIn's help page "Prohibited software and extensions" and User Agreement §8.2 ban software and extensions that scrape, modify the appearance of, or automate activity on LinkedIn, and LinkedIn scans browsers for known extensions.

- No scraping, no DOM reading, no automation, no requests to linkedin.com.
- Input is text the user pastes, or the user's own official data export ("Get a copy of your data").
- The user copies and posts by hand. Auto-posting is allowed only through approved official LinkedIn APIs, and only in a later phase.
- Processing stays local: no servers, no tracking. On-premises and self-hosting friendly.

## Layout

- `app/index.html`: a single-file local web app with seven tools (scam checker, privacy checker with image redaction, post checker, Arabic RTL carousel to PDF, profile reviewer, job matcher, export analyzer for the ZIP or `Connections.csv`/`Shares.csv`, which also fills the profile tab from `Profile.csv`/`Positions.csv`). Pure logic sits between `/*CORE-START*/` and `/*CORE-END*/` so tests can load it.
  - ZIP reading is hand-written (`readZip`, central directory + `DecompressionStream('deflate-raw')`, no library, no ZIP64).
  - Job matching uses `tokens`/`normWord` (light Arabic normalisation and prefix/suffix stripping, shared `STOP` list). Add filler words to `STOP` rather than special-casing them.
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
- PII rules are ordered: specific IDs (`eid`, `egnid`, `kwcid`) come before `card`, because overlapping matches keep the earlier rule. Validate with checksums or dates (`luhn`, `mod97`, `centuryOk`) where a format allows it; numbers without a distinctive format go through the context rule `idx`.
- The CV and profile text are never written to `localStorage`.
- Arabic copy: clear Modern Standard Arabic, short sentences, and official names of Saudi bodies (DGA, NDMO, SDAIA).
- License: MIT. Code stays dependency-free unless a library does real work.

## Status (v0.2.0, 2026-11-20)

Phase 1 done: the first five web tools and the seven skills.

Phase 2 done: profile and job-match tabs, export ZIP and `Shares.csv`/`Profile.csv`/`Positions.csv` support, PII patterns for UAE, Egypt, Kuwait, Qatar, Bahrain, Oman and Jordan, Arab IBANs with mod 97. Tests and `claude plugin validate .` pass; all tabs checked in headless Chromium (no console errors, no horizontal scroll at 375px, ZIP upload end to end).

## Open items

1. Verify the Saudi fraud-reporting channels named in `skills/job-scam-check/SKILL.md` (Absher, Kollona Amn) before the public launch.
2. Create a GitHub repo, push, and enable Pages.
3. Test with a real recent LinkedIn export ZIP. Column names for `Shares.csv`, `Profile.csv` and `Positions.csv` were written from the known export format and tested with synthetic files only; detection is header-based and tolerant.
4. Phase 3 from the roadmap (`docs/ROADMAP.md`).
