# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-purpose Node.js scraper that crawls the Information Systems Theories
wiki (`is.theorizeit.org`, a MediaWiki site) and saves a clean plain-text file
per theory. Output is intended as a corpus for a RAG chatbot, so files contain
only the wanted sections — no HTML, images, links, or wiki chrome.

## Commands

```bash
npm install     # install dependencies (axios, cheerio)
node scraper.js # crawl the wiki → one .txt per theory in scraped-text-files/
```

There is no build step and no test suite (`npm test` intentionally fails).

## Architecture

`scraper.js` is an ES module (`"type": "module"`) that reconstructs `__dirname`
via `fileURLToPath(import.meta.url)`. It runs a two-stage crawl:

1. **Discover** (`getTheoryLinks`) — fetches `config.indexPage` (the wiki
   `Main_Page`) and collects every bulleted article link
   (`.mw-parser-output li a[href^="/wiki/"]`). Links whose href contains `:`
   (namespace/disclaimer pages like `Special:` or `..._Theories:About`) are
   skipped, and results are deduped by href.

2. **Scrape each theory** (`scrapeTheory`) — fetches the article and extracts
   the page title plus each section named in `config.fields`, then writes
   `scraped-text-files/<slug>.txt`. Requests are throttled 300ms apart; failures
   are logged to `error.log` and do not abort the run.

Key implementation details future edits must respect:

- **Section extraction** (`extractSection`) matches headings by their **visible
  text**, not their HTML `id`. This is deliberate: MediaWiki ids contain
  characters like parentheses (`Originating_author(s)`) that are painful to use
  in CSS selectors. Content lives in the DOM siblings *following* a heading's
  `.mw-heading` wrapper, up to the next `.mw-heading` — captured with
  `.nextUntil('.mw-heading')`.

- **Cleaning** — within each section, `figure`, `img`, and `.plainlinks`
  (injected spam links) are removed, `<br>` is converted to newlines (preserves
  the seminal-article lists), and `.text()` drops all remaining markup. Runs of
  blank lines are collapsed.

- **Filenames** (`nameToSlug`) come from the theory's link text, lowercased with
  non-alphanumerics turned into single hyphens (e.g. "Absorptive capacity
  theory" → `absorptive-capacity-theory.txt`).

- A section that is genuinely empty on the wiki, or a list entry that is a red
  link to a non-existent article, yields `N/A` for that field. This is expected,
  not a bug — do not treat `N/A` output as a scraper failure without confirming
  the source page actually has content.

## Configuration

`config.json` drives the crawl:
- `baseUrl` — origin used to resolve relative `/wiki/` links.
- `indexPage` — the page whose article links become the scrape targets.
- `fields` — exact heading texts of the sections to keep, in output order.
