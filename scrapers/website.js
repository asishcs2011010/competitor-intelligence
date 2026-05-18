const { Firecrawl } = require("@mendable/firecrawl-js");
const competitors = require("../competitors");
require("dotenv").config();

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

async function scrapeCompetitor(competitor) {
  const sections = ["blog", "news", "resources", "events"];
  let output = `## ${competitor.name}\n\n`;

  for (const section of sections) {
    const url = competitor[section];
    if (!url) continue;

    console.log(`Scraping ${competitor.name} - ${section}: ${url}`);

    try {
      const result = await firecrawl.v1.scrapeUrl(url, {
        formats: ["markdown"],
      });

      const content = result?.markdown || "No content found.";
      output += `### ${section.charAt(0).toUpperCase() + section.slice(1)}\n${content}\n\n`;
    } catch (err) {
      console.error(`Failed: ${competitor.name} - ${section}:`, err.message);
      output += `### ${section.charAt(0).toUpperCase() + section.slice(1)}\nFailed to scrape.\n\n`;
    }
  }

  return output;
}

async function scrapeAll() {
  let fullOutput = "";

  for (const competitor of competitors) {
    const result = await scrapeCompetitor(competitor);
    fullOutput += result + "---\n\n";
  }

  return fullOutput;
}

module.exports = { scrapeAll };