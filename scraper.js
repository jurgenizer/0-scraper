import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// Turn a theory name into a filesystem-friendly slug, e.g.
// "Absorptive capacity theory" -> "absorptive-capacity-theory"
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics become hyphens
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens
}

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'scraped-text-files');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fetch the index page and return the list of { name, url } for every theory.
async function getTheoryLinks() {
  const { data: html } = await axios.get(config.indexPage);
  const $ = cheerio.load(html);

  const seen = new Set();
  const theories = [];
  // Theory entries are bullet-list links to /wiki/ articles in the page body.
  // Namespace links (containing ":", e.g. Special: or disclaimer pages) are skipped.
  $('.mw-parser-output li a[href^="/wiki/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href.includes(':')) return;
    const name = $(el).text().trim();
    if (!name || seen.has(href)) return;
    seen.add(href);
    theories.push({ name, url: new URL(href, config.baseUrl).href });
  });

  return theories;
}

// Extract the plain-text content of a section identified by its heading text.
// Content lives in the siblings following the heading's ".mw-heading" wrapper,
// up to the next heading. Links and images are dropped; only their text remains.
function extractSection($, headingText) {
  let heading = null;
  $('.mw-heading h2, .mw-heading h3').each((_, el) => {
    if ($(el).text().trim().toLowerCase() === headingText.toLowerCase()) {
      heading = $(el).closest('.mw-heading');
      return false; // stop at first match
    }
  });
  if (!heading || heading.length === 0) return '';

  const parts = [];
  heading.nextUntil('.mw-heading').each((_, el) => {
    const $el = $(el);
    $el.find('figure, img, .plainlinks').remove(); // drop images / injected spam links
    $el.find('br').replaceWith('\n');              // preserve line breaks (e.g. article lists)
    const text = $el.text().replace(/[ \t]+\n/g, '\n').trim();
    if (text) parts.push(text);
  });
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n'); // collapse runs of blank lines
}

async function scrapeTheory({ name, url }) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const title = $('#firstHeading').text().trim() || name;

  const sections = [`# ${title}`];
  for (const field of config.fields) {
    const content = extractSection($, field);
    sections.push(`## ${field}\n${content || 'N/A'}`);
  }

  const filePath = path.join(outputDir, `${nameToSlug(name)}.txt`);
  fs.writeFileSync(filePath, sections.join('\n\n') + '\n');
  console.log(`Saved: ${path.basename(filePath)}`);
}

async function run() {
  const theories = await getTheoryLinks();
  console.log(`Found ${theories.length} theories on the index page.`);

  for (const theory of theories) {
    try {
      await scrapeTheory(theory);
    } catch (error) {
      console.error(`Error scraping ${theory.url}: ${error.message}`);
      fs.appendFileSync(
        path.join(__dirname, 'error.log'),
        `Error scraping ${theory.url}: ${error.message}\n`
      );
    }
    // Throttle requests to avoid rate-limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`Done. Text files saved in "${path.basename(outputDir)}".`);
}

run();
