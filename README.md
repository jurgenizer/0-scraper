# 0-scraper

![0-scraper](scraper-open-graph-image.png)

Web scraper

## Description
A Node.js scraper that crawls the [Information Systems Theories wiki](https://is.theorizeit.org/wiki/Main_Page) and saves a clean plain-text file per theory. Each file contains only the theory name, its concise description, originating authors, and seminal articles — no HTML, images, or links — making the output suitable as a corpus for a RAG chatbot.

## Installation
```npm install```

## Usage
Run the scraper with ```node scraper.js```

It reads `config.json`, discovers every theory linked from the wiki's index page, and writes one `<theory-name>.txt` file per theory into `scraped-text-files/`.

## Configuration
`config.json` controls the crawl:
* `baseUrl` — the site origin used to resolve links.
* `indexPage` — the page whose article links are scraped.
* `fields` — the exact section headings to extract, in output order.

## Icon credits
<a href="https://www.magnific.com/icon/scraper_10984390#fromView=search&page=1&position=7&uuid=a020d8b6-98b5-43f7-ae4d-f07472f43b63">scraper-open-graph-image.png by Dby Freepik</a>

## License
MIT.
