const { ApifyClient } = require("apify-client");
require("dotenv").config();

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const COMPETITOR_LINKEDIN = [
  { name: "Testlio",     url: "https://www.linkedin.com/company/testlio/" },
  { name: "QA Wolf",     url: "https://www.linkedin.com/company/qa-wolf/" },
  { name: "Qualitest",   url: "https://www.linkedin.com/company/qualitest/" },
  { name: "Infosys BPM", url: "https://www.linkedin.com/company/infosys-bpm/" },
  { name: "Cigniti",     url: "https://www.linkedin.com/company/coforge-tech/" },
];

async function scrapeLinkedIn(previousPostIds = []) {
  console.log("🔗 Scraping LinkedIn via Apify...");
  console.log(`   Known post IDs from last week: ${previousPostIds.length}`);

  const run = await client.actor("harvestapi/linkedin-company-posts").call({
    targetUrls: COMPETITOR_LINKEDIN.map(c => c.url),
    maxPosts: 3,
    includeReposts: true,
    includeQuotePosts: true,
    scrapeComments: false,
    scrapeReactions: false,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  let output = "";
  const allPostIds = [];

  for (const competitor of COMPETITOR_LINKEDIN) {
    const urlLower = competitor.url.toLowerCase();

    const posts = items.filter(item => {
      const targetUrl = (item.query?.targetUrl || "").toLowerCase();
      return targetUrl.includes(urlLower);
    });

    // Collect all post IDs for saving (seen or not)
    posts.forEach(p => { if (p.id) allPostIds.push(p.id); });

    // Filter out posts already seen last week
    const newPosts = posts.filter(p => !previousPostIds.includes(p.id));

    output += `## ${competitor.name} — LinkedIn\n\n`;

    if (!newPosts.length) {
      const reason = posts.length > 0
        ? "[NO CHANGE SINCE LAST WEEK — skip this section]"
        : "No LinkedIn posts found this week.";
      output += `${reason}\n\n`;
      continue;
    }

    for (const post of newPosts.slice(0, 3)) {
      const text = (post.content || "No content").slice(0, 500);
      const date = post.postedAt?.date
        ? new Date(post.postedAt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Recent";
      output += `- [${date}] ${text}\n`;
    }

    output += "\n";
  }

  return { linkedInData: output, allPostIds };
}

module.exports = { scrapeLinkedIn };