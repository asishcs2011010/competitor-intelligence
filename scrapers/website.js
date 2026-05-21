const { Firecrawl } = require("@mendable/firecrawl-js");
const crypto = require("crypto");
const competitors = require("../competitors");
require("dotenv").config();

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

function hashContent(text) {
  return crypto.createHash("md5").update(text.trim()).digest("hex");
}

async function scrapeCompetitor(competitor, previousHashes = {}) {
  const sections = ["blog", "news", "resources", "events"];
  let output = `## ${competitor.name}\n\n`;
  const hashes = {};

  for (const section of sections) {
    const url = competitor[section];
    if (!url) continue;

    console.log(`  Scraping ${competitor.name} / ${section}: ${url}`);

    try {
      const result = await firecrawl.v1.scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: competitor.onlyMainContent !== false,
        waitFor: 8000,
        });

      const raw = result?.markdown || "No content found.";

      // Detect hard blockers
      const isConsentWall = raw.toLowerCase().includes("manage consent preferences") ||
        (raw.toLowerCase().includes("by clicking") && raw.toLowerCase().includes("cookies"));
      const is404 = raw.toLowerCase().includes("error 404") ||
        raw.toLowerCase().includes("page you requested could not be found");

      if (is404) {
        output += `### ${section.charAt(0).toUpperCase() + section.slice(1)} [404 — PAGE NOT FOUND]\nPage does not exist.\n\n`;
        continue;
      }

      if (isConsentWall) {
        output += `### ${section.charAt(0).toUpperCase() + section.slice(1)} [BLOCKED — consent wall]\nSite blocked scraper. No content accessible.\n\n`;
        continue;
      }

      const content = raw.slice(0, competitor.sliceSize || 8000);
      const hash = hashContent(content);
      const key = `${competitor.name}__${section}`;
      hashes[key] = hash;

      const prevHash = previousHashes[key];
      const label = !prevHash
        ? "[FIRST RUN — report everything found]"
        : prevHash === hash
          ? "[NO CHANGE SINCE LAST WEEK — skip this section]"
          : "[CHANGED THIS WEEK — report what is new]";

      output += `### ${section.charAt(0).toUpperCase() + section.slice(1)} ${label}\n${content}\n\n`;
    } catch (err) {
      console.error(`  Failed: ${competitor.name} / ${section}:`, err.message);
      output += `### ${section.charAt(0).toUpperCase() + section.slice(1)} [SCRAPE FAILED]\nFailed to scrape.\n\n`;
    }
  }

  return { output, hashes };
}

async function scrapeAll(previousHashes = {}) {
  let fullOutput = "";
  const allHashes = {};

  for (const competitor of competitors) {
    console.log(`\nScraping ${competitor.name}...`);
    const { output, hashes } = await scrapeCompetitor(competitor, previousHashes);
    fullOutput += output + "---\n\n";
    Object.assign(allHashes, hashes);
  }

  return { scrapedData: fullOutput, hashes: allHashes };
}

module.exports = { scrapeAll };