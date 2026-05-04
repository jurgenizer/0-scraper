import axios from 'axios';
import * as cheerio from 'cheerio'; // Import cheerio as a namespace
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration from config.json
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Derive a meaningful filename slug from a URL
function urlToSlug(url) {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    // Root URL — use hostname (e.g. "astro-build")
    return parsed.hostname.replace(/\./g, '-');
  }
  return segments[segments.length - 1];
}

// Ensure the output directory exists
const outputDir = path.join(__dirname, 'scraped-text-files');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function scrapePages(urls) {
  for (const url of urls) {
    try {
      const { data: html } = await axios.get(url);
      const $ = cheerio.load(html);

     // Adjust the selector to target the text content
     const text = $('body').text().trim(); 

      console.log(`Scraped data from: ${url}`);

      // Extract the slug from the URL and use it as the filename
      const slug = urlToSlug(url);
      const filePath = path.join(outputDir, `${slug}.txt`);
      fs.writeFileSync(filePath, `${text}\n\n`);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      // Log errors to a file
      fs.appendFileSync(path.join(__dirname, 'error.log'), `Error scraping ${url}: ${error.message}\n`);
    }

    // Throttle requests to avoid rate-limiting
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Scraping complete. Text files saved in the "scraped-text-files" directory.');
}

// Run the scraper with URLs from the config file
scrapePages(config.theUrls);