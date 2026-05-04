import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio'; // Import cheerio as a namespace

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'sitemap.xml');
const outputFilePath = path.join(__dirname, 'extracted-urls.txt');

// Read the sitemap.xml file
const xmlContent = fs.readFileSync(filePath, 'utf-8');

// Load the XML content using cheerio
const $ = cheerio.load(xmlContent, { xmlMode: true });

// Extract URLs from <loc> tags and surround them with quotes
const urls = [];
$('loc').each((index, element) => {
  const url = $(element).text().trim();
  urls.push(`"${url}",`);
});

// Write the extracted URLs to a new file
fs.writeFileSync(outputFilePath, urls.join('\n'), 'utf-8');

console.log('URLs extracted and saved to extracted-urls.txt');